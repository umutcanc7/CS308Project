/**
 * Sales Manager Routes
 * ---------------------------------
 * • GET  /pending-products     (get products with price = -1)
 * • PUT  /products/:id/price   (set price for product)
 *
 * Require header:   Authorization: Bearer <ADMIN-JWT>
 */
// salesmanager.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Product = require("../models/Product");

/* ───────── Verify ADMIN token ───────── */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, msg: "Admin token required" });

  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ success: false, msg: "Invalid admin token" });
    req.admin = payload;
    next();
  });
}

/* ───────── Get products awaiting price ───────── */
router.get("/pending-products", requireAdmin, async (_req, res) => {
  try {
    const products = await Product.find({ price: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

/* ───────── Set price for product ───────── */
router.put("/products/:id/price", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ success: false, msg: "Price must be a positive number" });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      id, 
      { price }, 
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    res.json({ success: true, data: product, msg: "Price updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router; 