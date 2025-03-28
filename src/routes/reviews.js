const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

// Middleware: Kullanıcının token'ını doğrula
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, error: "Token missing" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: "Invalid token" });
        req.user = user;
        next();
    });
}

// Yorum ekle (POST /reviews/:productId)
router.post("/:productId", authenticateToken, async (req, res) => {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!rating || !comment) {
        return res.status(400).json({ success: false, error: "Rating and comment are required." });
    }

    try {
        const existing = await Review.findOne({ userId: req.user.id, productId });
        if (existing) {
            return res.status(400).json({ success: false, error: "You already reviewed this product." });
        }

        const review = new Review({
            userId: req.user.id,
            productId,
            rating,
            comment,
        });

        await review.save();
        res.status(201).json({ success: true, message: "Review added successfully." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Belirli ürünün tüm yorumlarını getir (GET /reviews/:productId)
router.get("/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId });
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
