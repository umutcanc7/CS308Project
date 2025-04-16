// routes/purchase.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Purchase = require("../models/Purchase");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product"); // To get price & name details

// Configure Nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log("Nodemailer transporter configured for Gmail:", transporter.options);

// Token middleware with debugging
function authenticateToken(req, res, next) {
    console.log("Authenticating token...");
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("No token found.");
        return res.status(401).json({ success: false, error: "Token missing" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token verification failed:", err);
            return res.status(403).json({ success: false, error: "Invalid token" });
        }
        console.log("JWT verified for user:", user);
        req.user = user;
        next();
    });
}

/**
 * POST /checkout
 * Processes the entire cart.
 * Expects: 
 *   req.body.items = [ { id: "<Product ObjectId>", quantity: <number> }, ... ]
 */
router.post("/checkout", authenticateToken, async (req, res) => {
    console.log("Received checkout request with body:", req.body);
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: "Cart items are required." });
    }
    
    try {
        let receiptItems = [];
        let overallTotal = 0;

        // Process each cart item
        for (const item of items) {
            const { id, quantity } = item;
            if (!id) continue;

            // Create a purchase record
            const newPurchase = new Purchase({
                userId: req.user.id,
                productId: id,
            });
            await newPurchase.save();
            console.log("Purchase record saved for product", id);

            // Remove the item from the cart
            await Cart.findOneAndDelete({ userId: req.user.id, productId: id });
            console.log("Removed product from cart:", id);

            // Get product details (price, name, etc.)
            const product = await Product.findOne({ _id: id });
            if (!product) {
                console.log(`Product not found for id: ${id}`);
                continue;
            }
            const qty = quantity || 1;
            const lineTotal = product.price * qty;
            overallTotal += lineTotal;
            receiptItems.push({
                name: product.name,
                unitPrice: product.price,
                quantity: qty,
                lineTotal: lineTotal,
            });
        }

        // Retrieve the user (email from mail_adress field)
        console.log("Retrieving user from database with ID:", req.user.id);
        const user = await User.findById(req.user.id);
        if (!user || !user.mail_adress) {
            console.error("User email not found:", user);
        } else {
            // Build consolidated receipt email content
            let emailText = "Thank you for your purchase!\n\nPurchase Details:\n\n";
            receiptItems.forEach((item) => {
                emailText += `${item.name}: $${item.unitPrice.toFixed(2)} x ${item.quantity} = $${item.lineTotal.toFixed(2)}\n`;
            });
            emailText += `\nOverall Total: $${overallTotal.toFixed(2)}\n`;
            emailText += `Purchase Date: ${new Date().toLocaleString()}\n\nWe appreciate your business!`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.mail_adress,
                subject: "Your Purchase Receipt",
                text: emailText,
            };

            console.log("Sending consolidated receipt email...");
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error("Error sending email:", error);
                } else {
                    console.log("Receipt email sent successfully. Response:", info.response);
                }
            });
        }

        res.status(201).json({
            success: true,
            message: "Checkout processed, purchases recorded, and receipt email sent.",
            receiptItems,
            overallTotal,
        });
    } catch (error) {
        console.error("Error during checkout processing:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Existing endpoints (GET /purchase/user, etc.) can remain as is.
router.get("/user", authenticateToken, async (req, res) => {
    try {
        console.log("Fetching purchases for user:", req.user.id);
        const purchases = await Purchase.find({ userId: req.user.id }).populate("productId");
        console.log("Purchases retrieved:", purchases);
        res.json({ success: true, data: purchases });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
