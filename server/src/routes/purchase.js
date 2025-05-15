/* backend/routes/purchase.js ---------------------------------------------*/
const express      = require("express");
const router       = express.Router();
const jwt          = require("jsonwebtoken");
const nodemailer   = require("nodemailer");
const PDFDocument  = require("pdfkit");

const Purchase = require("../models/Purchase");
const Product  = require("../models/Product");
const Cart     = require("../models/Cart");
const User     = require("../models/User");

// --- ADMIN MIDDLEWARE (copied from productmanager.js) ---
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success:false, msg:"Admin token required" });
  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ success:false, msg:"Invalid admin token" });
    req.admin = payload;
    next();
  });
}

/* 🔐 ---------------------------------------------------------------- Token */
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success:false, error:"Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
    if (err) return res.status(403).json({ success:false, error:"Invalid token" });
    req.user = user;
    next();
  });
}

/* ✉️ ---------------------------------------------------------------- Mail */
const transporter = nodemailer.createTransport({
  service:"gmail",
  auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS }
});

/* 📄 ------------------------------------------------------------ PDF maker */
function buildReceiptPDF({ orderId, items, overallTotal }) {
  return new Promise((resolve, reject)=>{
    try {
      const doc   = new PDFDocument({ size:"A4", margin:40 });
      const bufs  = [];
      doc.on("data", d=>bufs.push(d));
      doc.on("end", ()=>resolve(Buffer.concat(bufs)));

      /* Header */
      doc.fontSize(26).text("SwagLab", { align:"center" }).moveDown();

      const today = new Date().toLocaleDateString("tr-TR");
      doc.fontSize(12).text(today, { align:"right" }).moveDown(1.5);

      doc.text(`Order Number: ${orderId}`).moveDown();

      items.forEach(it=>{
        doc.font("Helvetica-Bold").text(it.name);
        doc.font("Helvetica").text(it.code || "");
        doc.moveUp().text(`${it.quantity} × ${it.unitPrice.toFixed(2)} EUR`, { align:"right" });
        doc.moveDown();
      });

      doc.moveDown();
      doc.font("Helvetica-Bold").text("TOTAL", { align:"right" });
      doc.text(`${overallTotal.toFixed(2)} EUR`, { align:"right" });

      doc.end();
    } catch (e) { reject(e); }
  });
}

/* 🛒 ------------------------------------------------------------- POST / */
router.post("/", authenticateToken, async (req,res)=>{
  try {
    const userId    = req.user.id;

    /* (1) Gather the user's current cart */
    const cartItems = await Cart.find({ userId }).populate("productId");
    if (!cartItems.length)
      return res.status(400).json({ success:false, error:"Cart is empty." });

    /* (2) ➜  Generate ONE orderId for the whole checkout */
    const orderId       = `ORD-${Date.now()}-${Math.floor(Math.random()*10_000)}`;
    const receiptItems  = [];
    let   overallTotal  = 0;

    /* (3) Process every cart line */
    for (const item of cartItems) {
      const p = item.productId;
      if (!p || p.stock < item.quantity) {
        return res.status(400).json({ success:false,
          error:`Insufficient stock for ${p?.name || "a product"}` });
      }

      /* update stock */
      p.stock -= item.quantity;
      await p.save();

      const lineTotal  = item.quantity * p.price;
      overallTotal    += lineTotal;

      /* ⬇️ Every line reuses the SAME orderId */
      await new Purchase({
        userId,
        productId : p._id,
        quantity  : item.quantity,
        totalPrice: lineTotal,
        status    : "processing",
        orderId,
      }).save();

      receiptItems.push({
        name      : p.name,
        code      : p.barcode || p._id,
        quantity  : item.quantity,
        unitPrice : p.price,
        lineTotal,
      });
    }

    /* (4) Clear the cart */
    await Cart.deleteMany({ userId });

    /* (5) E-mail the receipt (if user has an address) */
    const user = await User.findById(userId);
    if (user?.mail_adress) {
      const pdfBuf = await buildReceiptPDF({ orderId, items:receiptItems, overallTotal });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to  : user.mail_adress,
        subject: "Your SwagLab Receipt",
        text   : "Thank you for your order! The receipt is attached.",
        attachments:[{ filename:`receipt_${orderId}.pdf`, content:pdfBuf }],
      });
      console.log("📧  Receipt e-mailed to", user.mail_adress);
    }

    /* (6) Respond to frontend */
    res.status(201).json({ success:true, message:"Order placed successfully.", orderId });
  } catch (e) {
    console.error("🔥  Error in POST /purchase:", e);
    res.status(500).json({ success:false, error:`Server error: ${e.message}` });
  }
});

/* 📜 ----------------------------------------------------- GET /purchase/user */
router.get("/user", authenticateToken, async (req,res)=>{
  try {
    const purchases = await Purchase
      .find({ userId:req.user.id })
      .populate("productId")
      .sort({ purchaseDate: -1 });

    res.json({ success:true, userId:req.user.id, data:purchases });
  } catch (e) {
    console.error("Error fetching purchases:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

/* 🆕 ------------------------------------------------ GET /purchase/receipt/:orderId */
router.get("/receipt/:orderId", authenticateToken, async (req,res)=>{
  try {
    const { orderId } = req.params;

    const purchases = await Purchase
      .find({ userId:req.user.id, orderId })
      .populate("productId");

    if (!purchases.length)
      return res.status(404).json({ success:false, error:"Order not found." });

    const items = purchases.map(p=>({
      name      : p.productId.name,
      code      : p.productId.barcode || p.productId._id,
      quantity  : p.quantity,
      unitPrice : p.productId.price,
      lineTotal : p.totalPrice,
    }));
    const overallTotal = items.reduce((t,i)=>t+i.lineTotal, 0);

    const pdfBase64 = (await buildReceiptPDF({ orderId, items, overallTotal }))
      .toString("base64");

    res.json({ success:true, pdfBase64 });
  } catch (e) {
    console.error("🔥  Error in GET /purchase/receipt:", e);
    res.status(500).json({ success:false, error:`Server error: ${e.message}` });
  }
});

// --- ADMIN: GET ALL PURCHASES ---
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const purchases = await Purchase.find().populate("productId userId").sort({ purchaseDate: -1 });
    res.json({ success: true, data: purchases });
  } catch (e) {
    console.error("Error fetching all purchases:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- ADMIN: UPDATE PURCHASE STATUS ---
router.patch("/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["processing", "in-transit", "delivered"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value." });
  }
  try {
    const updated = await Purchase.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: "Purchase not found." });
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error("Error updating purchase status:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;