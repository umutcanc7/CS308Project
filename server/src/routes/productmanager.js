/**
 * Category administration + public list
 * -------------------------------------
 * • GET     /categories           → everyone (used by Shop etc.)
 * • POST    /categories           → ADMIN token only
 * • DELETE  /categories/:name     → ADMIN token only
 *
 * Expect the client to send  Authorization: Bearer <ADMIN-JWT>
 */
const express  = require("express");
const router   = express.Router();
const Category = require("../models/Category");
const Product  = require("../models/Product");
const jwt      = require("jsonwebtoken");

/* ───────── middleware: verify ADMIN token ───────── */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success:false, msg:"Admin token required" });

  jwt.verify(token, process.env.ADMIN_JWT_SECRET, (err, payload) => {
    if (err)   return res.status(403).json({ success:false, msg:"Invalid admin token" });
    req.admin = payload;                     // not used further, but kept for audit if needed
    next();
  });
}

/* ───────── GET  /categories ───────── */
router.get("/categories", async (_req, res) => {
  const list = await Category.find().sort("name");
  res.json({ success:true, data:list });
});

/* ───────── POST /categories  body:{ name } ───────── */
router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ success:false, msg:"name is required" });

    const cat = await Category.create({ name });
    res.status(201).json({ success:true, data:cat });
  } catch (err) {
    // duplicate key → 11000
    const code = err.code === 11000 ? 409 : 400;
    res.status(code).json({ success:false, msg:err.message });
  }
});

/* ───────── DELETE /categories/:name ───────── */
router.delete("/categories/:name", requireAdmin, async (req, res) => {
  const { name } = req.params;

  // stop deletion if any product still uses the category
  if (await Product.exists({ category:name }))
    return res.status(409).json({ success:false, msg:`"${name}" is still assigned to products` });

  const result = await Category.deleteOne({ name });
  if (!result.deletedCount)
    return res.status(404).json({ success:false, msg:`"${name}" not found` });

  res.json({ success:true, msg:`"${name}" removed` });
});

// legacy alias so /categories still works for read-only clients
router.get("/categories", /* existing handler above will match */);

// Add this endpoint for stock adjustment
router.put("/products/:id/stock", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (typeof stock !== "number" || stock < 0) {
    return res.status(400).json({ success: false, msg: "Invalid stock value" });
  }
  try {
    const product = await Product.findByIdAndUpdate(id, { stock }, { new: true });
    if (!product) return res.status(404).json({ success: false, msg: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;