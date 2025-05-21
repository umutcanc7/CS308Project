const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");

// Token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    req.user = user;
    next();
  });
}

/* ───────── NEW: Check Address Before Checkout ───────── */
router.get("/user/address", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("address");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const address = user.address?.trim();
    if (!address) {
      return res.status(200).json({
      success: true,
      address: null,
      message: "Address is missing. Please update your address in the profile page.",
      });
    }  

    res.json({ success: true, address });
  } catch (error) {
    console.error("Error checking address:", error);
    res.status(500).json({ success: false, error: "Server error while checking address." });
  }
});

/* ───────── Merge Cart ───────── */
router.post("/merge", authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: "Cart items must be an array." });
  }

  try {
    for (const item of items) {
      const { productId, quantity, orderId } = item;
      if (!productId) continue;

      const existingItem = await Cart.findOne({ userId: req.user.id, productId });

      if (existingItem) {
        existingItem.quantity += quantity || 1;
        if (orderId) existingItem.orderId = orderId;
        await existingItem.save();
      } else {
        await new Cart({
          userId: req.user.id,
          productId,
          quantity: quantity || 1,
          orderId: orderId || undefined,
        }).save();
      }
    }
    res.json({ success: true, message: "Cart successfully merged." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ───────── Add Single Product to Cart ───────── */
router.post("/add", authenticateToken, async (req, res) => {
  const { productId, quantity, orderId, setQuantity } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: "Product ID is required." });
  }

  try {
    // Get the product to access its price information
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    const existingItem = await Cart.findOne({ userId: req.user.id, productId });

    if (existingItem) {
      if (setQuantity) {
        existingItem.quantity = quantity || 1;  // Set exact quantity
      } else {
        existingItem.quantity += quantity || 1;  // Add to existing quantity
      }
      if (orderId) existingItem.orderId = orderId;
      await existingItem.save();
      return res.json({ success: true, message: "Cart updated." });
    }

    // Create new cart item with price information
    await new Cart({
      userId: req.user.id,
      productId,
      quantity: quantity || 1,
      orderId: orderId || undefined,
      price: product.price,
      discountedPrice: product.discountedPrice || null,
      discountAmount: product.discountAmount || null
    }).save();

    res.status(201).json({ success: true, message: "Product added to cart." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ───────── Get User's Cart ───────── */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const items = await Cart.find({ userId: req.user.id }).populate("productId");
    // Transform the data to include price information
    const transformedItems = items.map(item => ({
      ...item.toObject(),
      productId: {
        ...item.productId.toObject(),
        // Use the stored price information instead of current product price
        price: item.price,
        discountedPrice: item.discountedPrice,
        discountAmount: item.discountAmount
      }
    }));
    res.json({ success: true, data: transformedItems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ───────── Delete Item from Cart ───────── */
router.delete("/:productId", authenticateToken, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id, productId: req.params.productId });
    res.json({ success: true, message: "Product removed from cart." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;