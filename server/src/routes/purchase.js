const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");

// 🔐 Token middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    req.user = user;
    next();
  });
}

// 📧 Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📄 Receipt generator
function buildReceiptPDF({ orderId, date, items, overallTotal }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(26).text("ZARA", { align: "center" }).moveDown();
      doc.fontSize(12).text(`Order Number: ${orderId}`).text(date, { align: "right" }).moveDown(1.5);

      // Items
      items.forEach(item => {
        doc.font("Helvetica-Bold").text(item.name);
        doc.font("Helvetica").text(`${item.code || ""}`);
        doc.moveUp();
        doc.text(`${item.quantity} x ${item.unitPrice.toFixed(2)} TL`, { align: "right" });
        doc.moveDown(0.5);
        doc.text(`${item.lineTotal.toFixed(2)} TL`, { align: "right" });
        doc.moveDown();
      });

      // Total
      doc.moveDown();
      doc.font("Helvetica-Bold").text("TOTAL", { align: "right" });
      doc.text(`${overallTotal.toFixed(2)} TL`, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// 🛒 POST /purchase — group cart into one order and send receipt
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user cart
    const cartItems = await Cart.find({ userId }).populate("productId");
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty." });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const receiptItems = [];
    let overallTotal = 0;

    // 2. Process each item
    for (const item of cartItems) {
      const product = item.productId;
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product?.name || "a product"}`,
        });
      }

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();

      const lineTotal = item.quantity * product.price;
      overallTotal += lineTotal;

      // Save purchase record
      await new Purchase({
        userId,
        productId: product._id,
        quantity: item.quantity,
        totalPrice: lineTotal,
        status: "processing",
        orderId,
      }).save();

      // Add to receipt
      receiptItems.push({
        name: product.name,
        code: product.barcode || product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      });
    }

    // 3. Clear user's cart
    await Cart.deleteMany({ userId });

    // 4. Email receipt
    const user = await User.findById(userId);
    if (user?.mail_adress) {
      const pdfBuffer = await buildReceiptPDF({
        orderId,
        date: new Date().toLocaleDateString("tr-TR"),
        items: receiptItems,
        overallTotal,
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.mail_adress,
        subject: "Your ZARA Receipt",
        text: "Thank you for your order! Please find your receipt attached.",
        attachments: [{ filename: `receipt_${orderId}.pdf`, content: pdfBuffer }],
      };

      await transporter.sendMail(mailOptions);
      console.log("📧 Receipt sent to", user.mail_adress);
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId,
    });
  } catch (err) {
    console.error("🔥 Error in /purchase:", err);
    return res.status(500).json({ success: false, error: `Server error: ${err.message}` });
  }
});

router.get("/user", authenticateToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id }).populate("productId");

    return res.json({
      success: true,
      userId: req.user.id, // ✅ Still sending userId like before
      data: purchases       // ✅ But now ALSO sending purchase list
    });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;
