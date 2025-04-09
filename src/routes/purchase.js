const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Purchase = require("../models/Purchase");

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

// Route: POST /purchase
router.post("/", authenticateToken, async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId) {
        return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    try {
        const newPurchase = new Purchase({
            userId: req.user.id,
            productId,
            quantity: quantity || 1,
        });

        await newPurchase.save();
        res.status(201).json({ success: true, message: "Purchase recorded successfully." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
