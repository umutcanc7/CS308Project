const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Token missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

// ✅ POST /purchase — Create a purchase and update stock
router.post("/", authenticateToken, async (req, res) => {
  const { productId, quantity, totalPrice } = req.body;

  console.log("🛒 Received purchase request from:", req.user?.id);
  console.log("📦 Body:", req.body);

  if (!productId || !quantity || !totalPrice) {
    return res.status(400).json({
      success: false,
      error: "Product ID, quantity, and total price are required.",
    });
  }

  try {
    // 1️⃣ Get the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // 2️⃣ Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} items in stock.`,
      });
    }

    // 3️⃣ Reduce the stock
    product.stock -= quantity;
    await product.save();

    // 4️⃣ Save the purchase
    const newPurchase = new Purchase({
      userId: req.user.id,
      productId,
      quantity,
      totalPrice,
      status: "processing",
    });

    await newPurchase.save();
    console.log("✅ Purchase saved to DB:", newPurchase);

    // 5️⃣ Remove from user's cart
    await Cart.findOneAndDelete({ userId: req.user.id, productId });

    res.status(201).json({
      success: true,
      message: "Purchase successful",
      orderId: newPurchase._id,
    });
  } catch (error) {
    console.error("🔥 Error during purchase saving:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

router.get("/user", authenticateToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id })
      .sort({ purchaseDate: -1 })
      .populate("productId"); // 💥 This is the key

    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// ✅ PATCH /purchase/:id/status — Update delivery status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  const purchaseId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ["processing", "in-transit", "delivered"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: "Invalid status value",
    });
  }

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    if (purchase.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    purchase.status = status;
    await purchase.save();

    res.json({
      success: true,
      message: "Status updated",
      data: purchase,
    });
  } catch (error) {
    console.error("🔥 Error updating status:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

module.exports = router;
