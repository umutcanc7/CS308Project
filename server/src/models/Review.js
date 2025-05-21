// Review.js 
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: "", // ✅ Default to empty if not given
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"], // ✅ Safe values
      default: "pending",
    },
  },
  { timestamps: true }
);

// ✅ One review per user per product
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
