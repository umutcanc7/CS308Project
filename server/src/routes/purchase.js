// routes/purchase.js – PDF receipt & e‑mail
// -----------------------------------------------------------------------------
//  Install once:   npm i pdfkit nodemailer jsonwebtoken
// -----------------------------------------------------------------------------
const express    = require("express");
const router     = express.Router();
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const Purchase = require("../models/Purchase");
const Product  = require("../models/Product");
const Cart     = require("../models/Cart");
const User     = require("../models/User");

// ────────────────────────────────────────────────────────────────────────────
// 📧  Nodemailer transporter (Gmail)
// ────────────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log("Nodemailer configured:", transporter.options.service);

// ────────────────────────────────────────────────────────────────────────────
// 🔐  JWT middleware
// ────────────────────────────────────────────────────────────────────────────
function authenticateToken(req, _res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return _res.status(401).json({ success: false, error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return _res.status(403).json({ success: false, error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 🖨️  Helper: build PDF receipt – returns Promise<Buffer>
// ────────────────────────────────────────────────────────────────────────────
function buildReceiptPDF({ orderId, date, items, overallTotal }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Header --------------------------------------------------------------
      doc.fontSize(26).text("ZARA", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Order number: ${orderId}`);
      doc.text(date, { align: "right" });
      doc.moveDown(1.5);

      // Line items ----------------------------------------------------------
      items.forEach((it) => {
        doc.font("Helvetica-Bold").text(it.name);
        doc.font("Helvetica").text(`${it.code || ""}`);
        doc.moveUp();
        doc.text(`${it.quantity} x ${it.unitPrice.toFixed(2)} TL`, { align: "right" });
        doc.moveDown(0.5);
        doc.text(`${it.lineTotal.toFixed(2)} TL`, { align: "right" });
        doc.moveDown();
      });

      // Totals --------------------------------------------------------------
      doc.moveDown();
      doc.font("Helvetica-Bold").text("TOTAL", { align: "right" });
      doc.text(`${overallTotal.toFixed(2)} TL`, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// ✅ POST /purchase – create purchase, email PDF receipt
// ────────────────────────────────────────────────────────────────────────────
router.post("/", authenticateToken, async (req, res) => {
  const { productId, quantity, totalPrice } = req.body;

  if (!productId || !quantity || !totalPrice) {
    return res.status(400).json({
      success: false,
      error: "Product ID, quantity, and total price are required.",
    });
  }

  try {
    /* 1️⃣  Validate product & stock ------------------------------------------------- */
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, error: `Only ${product.stock} items in stock` });
    }

    /* 2️⃣  Update stock ------------------------------------------------------------ */
    product.stock -= quantity;
    await product.save();

    /* 3️⃣  Save purchase ----------------------------------------------------------- */
    const newPurchase = new Purchase({
      userId: req.user.id,
      productId,
      quantity,
      totalPrice,
      status: "processing",
    });
    await newPurchase.save();

    /* 4️⃣  Remove from cart -------------------------------------------------------- */
    await Cart.findOneAndDelete({ userId: req.user.id, productId });

    /* 5️⃣  Email PDF receipt (fire‑and‑forget) ------------------------------------ */
    (async () => {
      try {
        const user = await User.findById(req.user.id);
        if (!user || !user.mail_adress) {
          console.error("User email missing – skipping receipt.");
          return;
        }

        const receiptItems = [
          {
            name: product.name,
            code: product.barcode || product._id,
            quantity,
            unitPrice: product.price,
            lineTotal: totalPrice,
          },
        ];

        const pdfBuffer = await buildReceiptPDF({
          orderId: newPurchase._id.toString(),
          date: new Date().toLocaleDateString("tr-TR"),
          items: receiptItems,
          overallTotal: totalPrice,
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.mail_adress,
          subject: "Your Purchase Receipt",
          text: "Thank you for your purchase! Your PDF receipt is attached.",
          attachments: [
            {
              filename: `receipt_${newPurchase._id}.pdf`,
              content: pdfBuffer,
            },
          ],
        };

        await transporter.sendMail(mailOptions);
        console.log("📧  Receipt e‑mail sent to", user.mail_adress);
      } catch (mailErr) {
        console.error("Failed to send receipt:", mailErr);
      }
    })();

    /* 6️⃣  Respond to client ------------------------------------------------------- */
    return res.status(201).json({ success: true, message: "Purchase successful", orderId: newPurchase._id });
  } catch (err) {
    console.error("🔥  Error in /purchase:", err);
    return res.status(500).json({ success: false, error: `Server error: ${err.message}` });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 📜  GET /purchase/user – list purchases
// ────────────────────────────────────────────────────────────────────────────
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id })
      .sort({ purchaseDate: -1 })
      .populate("productId");
    return res.json({ success: true, data: purchases });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// 🚚  PATCH /purchase/:id/status – update delivery status
// ────────────────────────────────────────────────────────────────────────────
router.patch("/:id/status", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["processing", "in-transit", "delivered"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, error: "Invalid status" });

  try {
    const purchase = await Purchase.findById(id);
    if (!purchase) return res.status(404).json({ success: false, error: "Purchase not found" });
    if (purchase.userId.toString() !== req.user.id) return res.status(403).json({ success: false, error: "Unauthorized" });

    purchase.status = status;
    await purchase.save();
    return res.json({ success: true, message: "Status updated", data: purchase });
  } catch (err) {
    console.error("Error updating status:", err);
    return res.status(500).json({ success: false, error: `Server error: ${err.message}` });
  }
});

module.exports = router;
