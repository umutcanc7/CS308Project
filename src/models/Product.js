const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  color: { type: String },
  category: { type: String }
});

module.exports = mongoose.model("Product", ProductSchema);