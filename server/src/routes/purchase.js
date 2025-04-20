const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Purchase = require("../models/Purchase");
const Cart = require("../models/Cart");
const User = require("../models/User");

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

// POST /purchase — Record a purchase
router.post("/", authenticateToken, async (req, res) => {
    const { productId, quantity, totalPrice, items } = req.body;

    if (!productId || !quantity || !totalPrice) {
        return res.status(400).json({ success: false, error: "Product ID, quantity, and total price are required." });
    }

    try {
        // Create and save the purchase record
        const newPurchase = new Purchase({
            userId: req.user.id,
            productId,
            quantity: quantity || 1,
            totalPrice,  // Store the total price of the items
            items,
        });

        await newPurchase.save();

        // Remove the purchased item from the user's cart
        await Cart.findOneAndDelete({ userId: req.user.id, productId });

        res.status(201).json({
            success: true,
            orderId: newPurchase._id,
            message: "Purchase recorded and item removed from cart.",
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;