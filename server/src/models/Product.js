// server/src/models/Product.js
const mongoose  = require("mongoose");
const Category  = require("./Category");      // <-- NEW

const ProductSchema = new mongoose.Schema({
  // product_id:    { type: Number, required: true, unique: true },
  product_id:    { type: Number, unique: true },
  name:          { type: String,  required: true },
  price:         { type: Number,  required: true },

  /* -------- Optional attributes -------- */
  color:         { type: String },
  averageRating: { type: Number,  default: 0 },
  image1:        String,
  image2:        String,
  image3:        String,

  /* -------- Inventory & description -------- */
  stock:         { type: Number,  default: 10 },
  description:   { type: String,  default: "" },

  /* -------- Discount Fields -------- */
  discountAmount: {
    type: Number,
    default: null,
  },
  discountedPrice: {
    type: Number,
    default: null,
  },

  /* -------- Finite, validated category -------- */
  category: {
    type: String,             // <-- stays a plain string for the UI
    required: true,
    validate: {
      validator: async function (value) {
        // True  → category exists   |   False → validation error
        return await Category.exists({ name: value });
      },
      message: (props) => 
  `Category "${props.value}" does not exist. Add it first or pick an existing one.`,
    },
  },
});

module.exports = mongoose.model("Product", ProductSchema);
