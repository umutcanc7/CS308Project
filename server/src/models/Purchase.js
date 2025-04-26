// server/src/models/Purchase.js

const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  status: { type: String, default: "processing" },
  orderId: { type: String, required: true } // ✅ Yeni alan: sipariş kimliği
});

module.exports = mongoose.model("Purchase", PurchaseSchema);