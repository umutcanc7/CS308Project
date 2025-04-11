// backend routes/purchase.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Purchase = require("../models/Purchase");
const Cart = require("../models/Cart"); // Import the Cart model

// Token middleware
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

// POST /purchase — Record a purchase and remove purchased item from the cart
router.post("/", authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId) {
        return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    try {
        // Create and save the purchase record
        const newPurchase = new Purchase({
            userId: req.user.id,
            productId,
            quantity: quantity || 1,
        });

        await newPurchase.save();

        // Remove the purchased item from the user's cart
        await Cart.findOneAndDelete({ userId: req.user.id, productId });

        res.status(201).json({ 
            success: true, 
            message: "Purchase recorded and item removed from cart successfully." 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ NEW: GET /purchase/user — Get user's purchased products with product info
router.get("/user", authenticateToken, async (req, res) => {
    try {
        const purchases = await Purchase.find({ userId: req.user.id }).populate("productId");
        res.json({ success: true, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
