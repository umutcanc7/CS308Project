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

/* --- SALES-ADMIN or ADMIN GUARD --- */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success:false, msg:"Admin token required" });

  // try sales-admin secret first …
  jwt.verify(token, process.env.SALES_ADMIN_JWT_SECRET, (err, payload) => {
    if (!err) { req.salesAdmin = payload; return next(); }

    // … fall back to full-admin secret
    jwt.verify(token, process.env.ADMIN_JWT_SECRET, (adErr, adPayload) => {
      if (adErr) return res.status(403).json({ success:false, msg:"Invalid admin token" });
      req.admin = adPayload;
      next();
    });
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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const bufs = [];
      doc.on("data", d => bufs.push(d));
      doc.on("end", () => resolve(Buffer.concat(bufs)));

      /* Header */
      doc.fontSize(26).text("SwagLab", { align: "center" }).moveDown();

      const today = new Date().toLocaleDateString("tr-TR");
      doc.fontSize(12).text(today, { align: "right" }).moveDown(1.5);

      doc.text(`Order Number: ${orderId}`).moveDown();

      items.forEach(it => {
        doc.font("Helvetica-Bold").text(it.name);
        doc.font("Helvetica").text(it.code || "");

        // Calculate effective unit price for display
        let effectivePrice = null;
        if (typeof it.discountedPrice === 'number') {
          effectivePrice = it.discountedPrice;
        } else if (typeof it.originalPrice === 'number') {
          effectivePrice = it.originalPrice;
        } else if (typeof it.lineTotal === 'number' && it.quantity) {
          effectivePrice = it.lineTotal / it.quantity;
        } else if (typeof it.totalPrice === 'number' && it.quantity) {
          effectivePrice = it.totalPrice / it.quantity;
        } else if (it.productId && typeof it.productId.price === 'number') {
          effectivePrice = it.productId.price;
        } else {
          effectivePrice = 0;
        }

        // Show price info
        if (typeof it.discountedPrice === 'number' && typeof it.discountAmount === 'number') {
          doc.font("Helvetica").text(`Original Price: ${Number(it.originalPrice).toFixed(2)} EUR`);
          doc.font("Helvetica-Bold").text(`Discounted Price: ${Number(it.discountedPrice).toFixed(2)} EUR (${it.discountAmount}% off)`, { color: '#e74c3c' });
        } else if (typeof it.originalPrice === 'number') {
          doc.font("Helvetica").text(`Price: ${Number(it.originalPrice).toFixed(2)} EUR`);
        } else {
          doc.font("Helvetica").text(`Price: ${Number(effectivePrice).toFixed(2)} EUR`);
        }

        doc.moveUp().text(`${it.quantity} × ${Number(effectivePrice).toFixed(2)} EUR`, { align: "right" });
        doc.moveDown();
      });

      doc.moveDown();
      doc.font("Helvetica-Bold").text("TOTAL", { align: "right" });
      doc.text(`${overallTotal.toFixed(2)} EUR`, { align: "right" });

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

      // Get the effective price (discounted if available)
      const effectivePrice = item.discountedPrice || item.price;
      const lineTotal = item.quantity * effectivePrice;
      overallTotal += lineTotal;

      /* ⬇️ Every line reuses the SAME orderId */
      await new Purchase({
        userId,
        productId: p._id,
        quantity: item.quantity,
        totalPrice: lineTotal,
        originalPrice: item.price,
        // Only store discount information if it exists
        ...(item.discountedPrice && {
          discountedPrice: item.discountedPrice,
          discountAmount: item.discountAmount
        }),
        status: "processing",
        orderId
      }).save();

      receiptItems.push({
        name: p.name,
        code: p.barcode || p._id,
        quantity: item.quantity,
        originalPrice: item.price,
        // Only include discount information if it exists
        ...(item.discountedPrice && {
          discountedPrice: item.discountedPrice,
          discountAmount: item.discountAmount
        }),
        lineTotal
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

    const items = purchases.map(p => ({
      name: p.productId.name,
      code: p.productId.barcode || p.productId._id,
      quantity: p.quantity,
      originalPrice: p.originalPrice,
      // Only include discount information if it exists
      ...(p.discountedPrice && {
        discountedPrice: p.discountedPrice,
        discountAmount: p.discountAmount
      }),
      lineTotal: p.totalPrice
    }));
    const overallTotal = items.reduce((t, i) => t + i.lineTotal, 0);

    const pdfBase64 = (await buildReceiptPDF({ orderId, items, overallTotal }))
      .toString("base64");

    res.json({ success: true, pdfBase64 });
  } catch (e) {
    console.error("🔥  Error in GET /purchase/receipt:", e);
    res.status(500).json({ success: false, error: `Server error: ${e.message}` });
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

/* ──────────────────────────  SALES ANALYTICS  ────────────────────────── */
/**
 *  GET /purchase/metrics
 *  ↳  Aggregate revenue & profit (cost = ½ × Product.price × qty)
 *
 *  Query params
 *    granularity  day | month | year  (default "month")
 *    start        ISO date (inclusive) - optional
 *    end          ISO date (inclusive) - optional
 *
 *  Response:  { success:true, data:[
 *                { label:"2025-05", revenue:1234.56, profit:789.01 },
 *                …
 *              ] }
 */
router.get("/metrics", requireAdmin, async (req, res) => {
  try {
    const { granularity = "month", start, end } = req.query;

    /* ---------- optional date window ---------- */
    const match = {};
    if (start) match.purchaseDate = { ...match.purchaseDate, $gte: new Date(start) };
    if (end)   match.purchaseDate = { ...match.purchaseDate, $lte: new Date(end)   };

    /* ---------- fetch purchases + pull unit price from Product ---------- */
    const purchases = await Purchase
      .find(match)
      .populate("productId", "price")          // only need price
      .select("purchaseDate quantity totalPrice");

    /* ---------- helper to label buckets ---------- */
    const makeLabel = (d) => {
      const y  = d.getUTCFullYear();
      const m  = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      if (granularity === "day")  return `${y}-${m}-${dd}`;
      if (granularity === "year") return `${y}`;
      return `${y}-${m}`;                 // default → month
    };

    /* ---------- aggregate ---------- */
    const grouped = {};   // { label: { revenue:…, profit:… } }

    purchases.forEach((p) => {
      const label   = makeLabel(p.purchaseDate);
      const revenue = Number(p.totalPrice) || 0;

      // unit cost = 0.5 × current Product.price
      const unitPrice = Number(p.productId?.price) || 0;
      const cost      = 0.5 * unitPrice * p.quantity;
      const profit    = revenue - cost;

      grouped[label] ??= { revenue: 0, profit: 0 };
      grouped[label].revenue += revenue;
      grouped[label].profit  += profit;
    });

    const data = Object.entries(grouped)
      .sort(([a],[b]) => a.localeCompare(b))          // chronological
      .map(([label, { revenue, profit }]) => ({
        label,
        revenue: Number(revenue.toFixed(2)),
        profit : Number(profit .toFixed(2)),
      }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error aggregating metrics:", err);
    res.status(500).json({ success: false, error: err.message });
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

// --- CANCEL PRODUCT IN ORDER ---
router.delete("/:id/cancel", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: "Purchase not found." });
    }

    // Check if the product is in processing status
    if (purchase.status !== "processing") {
      return res.status(400).json({ 
        success: false, 
        error: "Only products in 'processing' status can be canceled." 
      });
    }

    // Check if the user owns this purchase
    if (purchase.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: "You are not authorized to cancel this purchase." 
      });
    }

    // Restore product stock
    const product = await Product.findById(purchase.productId);
    if (product) {
      product.stock += purchase.quantity;
      await product.save();
    }

    // Delete the purchase
    await Purchase.findByIdAndDelete(id);

    res.json({ success: true, message: "Product successfully canceled." });
  } catch (e) {
    console.error("Error canceling purchase:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- REQUEST REFUND ---
router.post("/:id/refund", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: "Purchase not found." });
    }

    // Check if the product is delivered
    if (purchase.status !== "delivered") {
      return res.status(400).json({ 
        success: false, 
        error: "Only delivered products can be refunded." 
      });
    }

    // Check if the user owns this purchase
    if (purchase.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: "You are not authorized to request a refund for this purchase." 
      });
    }

    // Check if 30 days have passed since delivery
    const deliveryDate = purchase.purchaseDate;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (deliveryDate < thirtyDaysAgo) {
      return res.status(400).json({ 
        success: false, 
        error: "Refund can only be requested within 30 days of delivery." 
      });
    }

    // Update purchase with refund request
    purchase.refundStatus = "requested";
    purchase.refundRequestDate = new Date();
    await purchase.save();

    res.json({ success: true, message: "Refund request submitted successfully." });
  } catch (e) {
    console.error("Error requesting refund:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- APPROVE REFUND (Sales Manager) ---
router.post("/:id/approve-refund", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: "Purchase not found." });
    }

    // Check if refund was requested
    if (purchase.refundStatus !== "requested") {
      return res.status(400).json({ 
        success: false, 
        error: "This purchase does not have a pending refund request." 
      });
    }

    // Update purchase with refund approval
    purchase.refundStatus = "approved";
    purchase.refundApprovalDate = new Date();

    // Restore product stock
    const product = await Product.findById(purchase.productId);
    if (product) {
      product.stock += purchase.quantity;
      await product.save();
    }

    // Delete the purchase
    await Purchase.findByIdAndDelete(id);

    // Notify user via email
    const user = await User.findById(purchase.userId);
    if (user?.mail_adress) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.mail_adress,
        subject: "Your Refund Request Has Been Approved",
        text: `Your refund request for order ${purchase.orderId} has been approved. The refund amount of ${purchase.totalPrice} EUR will be processed shortly.`,
      });
    }

    res.json({ success: true, message: "Refund approved and purchase deleted." });
  } catch (e) {
    console.error("Error approving refund:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- REJECT REFUND (Sales Manager) ---
router.post("/:id/reject-refund", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, error: "Purchase not found." });
    }

    // Check if refund was requested
    if (purchase.refundStatus !== "requested") {
      return res.status(400).json({ 
        success: false, 
        error: "This purchase does not have a pending refund request." 
      });
    }

    // Update purchase with refund rejection
    purchase.refundStatus = "rejected";
    await purchase.save();

    // Notify user via email
    const user = await User.findById(purchase.userId);
    if (user?.mail_adress) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.mail_adress,
        subject: "Your Refund Request Has Been Rejected",
        text: `Your refund request for order ${purchase.orderId} has been rejected. If you have any questions, please contact our customer service.`,
      });
    }

    res.json({ success: true, message: "Refund request rejected." });
  } catch (e) {
    console.error("Error rejecting refund:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* 🆕 ADMIN — GET RECEIPT FOR ANY ORDER */
router.get("/admin/receipt/:orderId", requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    const purchases = await Purchase
      .find({ orderId })
      .populate("productId");

    if (!purchases.length)
      return res.status(404).json({ success: false, error: "Order not found." });

    const items = purchases.map(p => ({
      name: p.productId.name,
      code: p.productId.barcode || p.productId._id,
      quantity: p.quantity,
      originalPrice: p.originalPrice,
      // Only include discount information if it exists
      ...(p.discountedPrice && {
        discountedPrice: p.discountedPrice,
        discountAmount: p.discountAmount
      }),
      lineTotal: p.totalPrice
    }));
    const overallTotal = items.reduce((t, i) => t + i.lineTotal, 0);

    const pdfBase64 = (await buildReceiptPDF({ orderId, items, overallTotal }))
      .toString("base64");

    res.json({ success: true, pdfBase64 });
  } catch (e) {
    console.error("🔥  Error in GET /purchase/admin/receipt:", e);
    res.status(500).json({ success: false, error: `Server error: ${e.message}` });
  }
});

module.exports = router;