const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const jwt = require("jsonwebtoken");

// Token doğrulama middleware
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

/**
 * Merge local cart items into the user's cart.
 * Expects req.body.items to be an array of objects:
 * [
 *   { productId: someId, quantity: someQuantity, orderId: optionalOrderId },
 *   ...
 * ]
 */
router.post("/merge", authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res
      .status(400)
      .json({ success: false, error: "Cart items are required and must be an array." });
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
        const newCartItem = new Cart({
          userId: req.user.id,
          productId,
          quantity: quantity || 1,
          orderId: orderId || undefined,
        });
        await newCartItem.save();
      }
    }
    res.json({ success: true, message: "Cart successfully merged." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add single product to cart
router.post("/add", authenticateToken, async (req, res) => {
  const { productId, quantity, orderId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: "Product ID is required." });
  }

  try {
    const existingItem = await Cart.findOne({ userId: req.user.id, productId });

    if (existingItem) {
      existingItem.quantity += quantity || 1;
      if (orderId) existingItem.orderId = orderId;
      await existingItem.save();
      return res.json({ success: true, message: "Cart updated." });
    }

    const newItem = new Cart({
      userId: req.user.id,
      productId,
      quantity: quantity || 1,
      orderId: orderId || undefined,
    });

    await newItem.save();
    res.status(201).json({ success: true, message: "Product added to cart." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's cart
router.get("/", authenticateToken, async (req, res) => {
  try {
    const items = await Cart.find({ userId: req.user.id }).populate("productId");
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete an item from cart
router.delete("/:productId", authenticateToken, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user.id, productId: req.params.productId });
    res.json({ success: true, message: "Product removed from cart." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
