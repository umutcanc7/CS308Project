// Cart.js
const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1, min: 1 },
  orderId: { type: String }, // Optional order ID
  price: { type: Number, required: true }, // Original price at time of adding
  discountedPrice: { type: Number }, // Discounted price if available
  discountAmount: { type: Number }, // Discount percentage if available
}, { timestamps: true });

module.exports = mongoose.model("Cart", CartItemSchema);