const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String },
  category: { type: String },
  averageRating: { type: Number, default: 0 },

  // ✅ Add these new fields
  stock: { type: Number, default: 10 },
  description: { type: String, default: "" }
});

module.exports = mongoose.model("Product", ProductSchema);
