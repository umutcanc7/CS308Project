const mongoose = require("mongoose");

const SalesAdminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesAdmin", SalesAdminSchema);