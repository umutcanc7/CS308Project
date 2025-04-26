/* backend/routes/purchase.js ------------------------------------------------*/
const express      = require("express");
const router       = express.Router();
const jwt          = require("jsonwebtoken");
const nodemailer   = require("nodemailer");
const PDFDocument  = require("pdfkit");

const Purchase = require("../models/Purchase");
const Product  = require("../models/Product");
const Cart     = require("../models/Cart");
const User     = require("../models/User");

/* 🔐 ---------------------------------------------------------------- Token */
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success:false, error:"Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
    if (err) return res.status(403).json({ success:false, error:"Invalid token" });
    req.user = user; next();
  });
}

/* ✉️ ---------------------------------------------------------------- Mail */
const transporter = nodemailer.createTransport({
  service:"gmail",
  auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASS }
});

/* 📄 ------------------------------------------------------------ PDF maker */
function buildReceiptPDF({ orderId, date, items, overallTotal }) {
  return new Promise((resolve, reject)=>{
    try {
      const doc   = new PDFDocument({ size:"A4", margin:40 });
      const bufs  = [];
      doc.on("data", d=>bufs.push(d));
      doc.on("end", ()=>resolve(Buffer.concat(bufs)));

      /* Header */
      doc.fontSize(26).text("SwagLab", { align:"center" }).moveDown();

      /* ① always use today's date so it never shows "Invalid Date" */
      const today = new Date().toLocaleDateString("tr-TR");
      doc.fontSize(12).text(today, { align:"right" }).moveDown(1.5);

      /* Order number + ② one blank line after it */
      doc.text(`Order Number: ${orderId}`).moveDown();

      /* Lines */
      items.forEach(it=>{
        doc.font("Helvetica-Bold").text(it.name);
        doc.font("Helvetica").text(it.code || "");
        doc.moveUp().text(`${it.quantity} × ${it.unitPrice.toFixed(2)} EUR`, { align:"right" });
        doc.moveDown();
      });

      /* Total */
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

    /* (1) Gather the user’s current cart */
    const cartItems = await Cart.find({ userId }).populate("productId");
    if (!cartItems.length)
      return res.status(400).json({ success:false, error:"Cart is empty." });

    const orderId       = `ORD-${Date.now()}-${Math.floor(Math.random()*10_000)}`;
    const receiptItems  = [];
    let   overallTotal  = 0;

    /* (2) Process every cart line */
    for (const item of cartItems) {
      const p = item.productId;
      if (!p || p.stock < item.quantity) {
        return res.status(400).json({ success:false,
          error:`Insufficient stock for ${p?.name || "a product"}` });
      }

      /* update stock */
      p.stock -= item.quantity; await p.save();

      const lineTotal = item.quantity * p.price;
      overallTotal   += lineTotal;

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

    /* (3) Clear the cart */
    await Cart.deleteMany({ userId });

    /* (4) E-mail the receipt */
    const user = await User.findById(userId);
    if (user?.mail_adress) {
      const pdfBuf = await buildReceiptPDF({
        orderId,
        date : new Date().toLocaleDateString("tr-TR"),
        items: receiptItems,
        overallTotal,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to  : user.mail_adress,
        subject: "Your SwagLab Receipt",
        text   : "Thank you for your order! The receipt is attached.",
        attachments:[{ filename:`receipt_${orderId}.pdf`, content:pdfBuf }],
      });
      console.log("📧  Receipt e-mailed to", user.mail_adress);
    }

    /* (5) Tell frontend the order ID (unchanged) */
    res.status(201).json({ success:true, message:"Order placed successfully.", orderId });
  } catch (e) {
    console.error("🔥  Error in POST /purchase:", e);
    res.status(500).json({ success:false, error:`Server error: ${e.message}` });
  }
});

/* 📜 ----------------------------------------------------- GET /purchase/user */
router.get("/user", authenticateToken, async (req,res)=>{
  try {
    const purchases = await Purchase.find({ userId:req.user.id }).populate("productId");
    res.json({ success:true, userId:req.user.id, data:purchases });
  } catch (e) {
    console.error("Error fetching purchases:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

/* 🆕 ------------------------------------------------ GET /purchase/receipt/:orderId
      → returns { success, pdfBase64 } */
router.get("/receipt/:orderId", authenticateToken, async (req,res)=>{
  try {
    const { orderId } = req.params;

    /* Pull every purchase line that belongs to this order & user */
    const purchases = await Purchase
      .find({ userId:req.user.id, orderId })
      .populate("productId");

    if (!purchases.length)
      return res.status(404).json({ success:false, error:"Order not found." });

    /* Re-create the data needed for the PDF */
    const items = purchases.map(p=>({
      name      : p.productId.name,
      code      : p.productId.barcode || p.productId._id,
      quantity  : p.quantity,
      unitPrice : p.productId.price,
      lineTotal : p.totalPrice,
    }));
    const overallTotal = items.reduce((t,i)=>t+i.lineTotal, 0);

    const pdfBase64 = (await buildReceiptPDF({
      orderId,
      date : new Date(purchases[0].createdAt).toLocaleDateString("tr-TR"),
      items, overallTotal,
    })).toString("base64");

    res.json({ success:true, pdfBase64 });
  } catch (e) {
    console.error("🔥  Error in GET /purchase/receipt:", e);
    res.status(500).json({ success:false, error:`Server error: ${e.message}` });
  }
});

module.exports = router;