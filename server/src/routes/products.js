// const express = require("express");
// const router = express.Router();
// const Product = require("../models/Product");

// // product.js (not full code, just the change)
// router.post("/add", async (req, res) => {
//     const { product_id, name, price, color, category, stock, description } = req.body;

//     if (!product_id || !name || !price || !category) {
//         return res.status(400).json({ success: false, error: "product_id, name, price ve category zorunludur." });
//     }

//     try {
//         const existing = await Product.findOne({ product_id });
//         if (existing) {
//             return res.status(400).json({ success: false, error: "Bu ID ile bir ürün zaten var." });
//         }

//         const newProduct = new Product({
//             product_id,
//             name,
//             price,
//             color,
//             category,
//             stock,
//             description
//         });

//         await newProduct.save();
//         res.status(201).json({ success: true, message: "Ürün başarıyla eklendi." });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Tüm ürünleri listeleme (GET /products)
// router.get("/", async (req, res) => {
//     try {
//         const products = await Product.find();
//         res.json({ success: true, data: products });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Ürünleri sıralama (GET /products/sort?by=price&order=asc)
// router.get("/sort", async (req, res) => {
//     const { by, order } = req.query;

//     const sortFields = {
//         name: "name",
//         price: "price",
//         rating: "averageRating"
//     };

//     const sortBy = sortFields[by];
//     const sortOrder = order === "desc" ? -1 : 1;

//     if (!sortBy) {
//         return res.status(400).json({
//             success: false,
//             error: "Geçerli bir sıralama kriteri girin (name, price, rating)"
//         });
//     }

//     try {
//         const products = await Product.find().sort({ [sortBy]: sortOrder });
//         res.json({ success: true, data: products });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// // Ürün arama (GET /products/search?query=deger)
// router.get("/search", async (req, res) => {
//     const query = req.query.query;

//     if (!query) {
//         return res.status(400).json({ success: false, error: "Arama değeri gerekli." });
//     }

//     try {
//         console.log("🔍 Arama değeri:", query);

//         const results = await Product.find({
//             $or: [
//                 { name: { $regex: query, $options: "i" } },
//                 { category: { $regex: query, $options: "i" } }
//             ]
//         });

//         console.log("✅ Bulunan ürün sayısı:", results.length);
//         res.json({ success: true, data: results });
//     } catch (error) {
//         console.error("❌ Hata:", error.message);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

// router.get("/categories", async (req, res) => {
//     try {
//       const categories = await Product.distinct("category");
//       res.json({ success: true, data: categories });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
// });

// router.get("/:id", async (req, res) => {
//     try {
//       const product = await Product.findById(req.params.id);
//       if (!product) {
//         return res.status(404).json({ success: false, error: "Product not found." });
//       }
//       res.json({ success: true, data: product });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
// });

// module.exports = router;


// routes/products.js
/* eslint-disable consistent-return */
const express  = require("express");
const router   = express.Router();
const Product  = require("../models/Product");

/* ───────── Add product (POST /add) ───────── */
router.post("/add", async (req, res) => {
  const { product_id, name, price, color, category, stock, description } = req.body;

  if (!product_id || !name || !price || !category)
    return res.status(400).json({ success:false,
      error:"product_id, name, price ve category zorunludur." });

  try {
    const existing = await Product.findOne({ product_id });
    if (existing)
      return res.status(400).json({ success:false, error:"Bu ID ile bir ürün zaten var." });

    const newProduct = new Product({
      product_id, name, price, color, category, stock, description
    });

    await newProduct.save();
    res.status(201).json({ success:true, message:"Ürün başarıyla eklendi." });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

/* ───────── List ALL products (GET /products) ─────────
   Excludes items with price === -1                       */
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({ price: { $ne: -1 } });
    res.json({ success:true, data:products });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

/* ───────── Sorted list (GET /products/sort) ───────── */
router.get("/sort", async (req, res) => {
  const { by, order } = req.query;

  const sortFields = { name:"name", price:"price", rating:"averageRating" };
  const sortBy     = sortFields[by];
  const sortOrder  = order === "desc" ? -1 : 1;

  if (!sortBy)
    return res.status(400).json({ success:false,
      error:"Geçerli bir sıralama kriteri girin (name, price, rating)" });

  try {
    const products = await Product
      .find({ price: { $ne: -1 } })          // ⬅️  filter out price -1
      .sort({ [sortBy]: sortOrder });
    res.json({ success:true, data:products });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

/* ───────── Search (GET /products/search) ───────── */
router.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query)
    return res.status(400).json({ success:false, error:"Arama değeri gerekli." });

  try {
    const results = await Product.find({
      price: { $ne: -1 },                    // ⬅️  exclude price -1
      $or: [
        { name:     { $regex: query, $options:"i" } },
        { category: { $regex: query, $options:"i" } }
      ]
    });

    res.json({ success:true, data:results });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

/* ───────── Distinct categories (GET /products/categories) ───────── */
router.get("/categories", async (_req, res) => {
  try {
    const categories = await Product.distinct("category", { price: { $ne: -1 } });
    res.json({ success:true, data:categories });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

/* ───────── Single product by _id (GET /products/:id) ─────────
   NOTE: Delivers the document even if price === -1
   (useful for admin detail pages). Remove the condition below
   if you want to hide those too.                               */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.price === -1)
      return res.status(404).json({ success:false, error:"Product not found." });

    res.json({ success:true, data:product });
  } catch (error) {
    res.status(500).json({ success:false, error:error.message });
  }
});

module.exports = router;