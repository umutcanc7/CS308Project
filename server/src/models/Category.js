// server/src/models/Category.js
const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,          // "  Shoes  " → "Shoes"
      minlength: 1
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);