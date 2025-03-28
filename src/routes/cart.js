const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const jwt = require("jsonwebtoken");

// Token doğrulama middleware
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

// Sepete ürün ekle (POST /cart/add)
router.post("/add", authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId) {
        return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    try {
        const existingItem = await Cart.findOne({ userId: req.user.id, productId });
        if (existingItem) {
            existingItem.quantity += quantity || 1;
            await existingItem.save();
            return res.json({ success: true, message: "Cart updated." });
        }

        const newItem = new Cart({
            userId: req.user.id,
            productId,
            quantity: quantity || 1,
        });

        await newItem.save();
        res.status(201).json({ success: true, message: "Product added to cart." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sepeti getir (GET /cart)
router.get("/", authenticateToken, async (req, res) => {
    try {
        const items = await Cart.find({ userId: req.user.id }).populate("productId");
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sepetten ürün sil (DELETE /cart/:productId)
router.delete("/:productId", authenticateToken, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user.id, productId: req.params.productId });
        res.json({ success: true, message: "Product removed from cart." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
