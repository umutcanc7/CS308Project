const mongoose = require("mongoose");

/*  One-to-one link to a User document.
    You decide who is admin simply by inserting their userId here. */
const AdminSchema = new mongoose.Schema(
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

module.exports = mongoose.model("Admin", AdminSchema);