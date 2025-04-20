const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    purchaseDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Purchase", PurchaseSchema);
