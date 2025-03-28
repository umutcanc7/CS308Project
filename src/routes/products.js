const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Yeni ürün ekleme (POST /products/add)
router.post("/add", async (req, res) => {
    const { product_id, name, price, color, category } = req.body;

    if (!product_id || !name || !price || !category) {
        return res.status(400).json({ success: false, error: "product_id, name, price ve category zorunludur." });
    }

    try {
        const existing = await Product.findOne({ product_id });
        if (existing) {
            return res.status(400).json({ success: false, error: "Bu ID ile bir ürün zaten var." });
        }

        const newProduct = new Product({ product_id, name, price, color, category });
        await newProduct.save();
        res.status(201).json({ success: true, message: "Ürün başarıyla eklendi." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Tüm ürünleri listeleme (GET /products)
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
