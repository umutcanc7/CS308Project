require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// Kullanıcı Kaydı (Register)
router.post("/register", async (req, res) => {
    const { name, password, phone_number, mail_adress } = req.body;

    if (!name || !password || !mail_adress) {
        return res.status(400).json({ success: false, error: "Name, password, and mail_adress are required." });
    }

    try {
        const existingUser = await User.findOne({ mail_adress });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "E-mail already registered!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, password: hashedPassword, phone_number, mail_adress });
        await newUser.save();

        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Kullanıcı Girişi (Login) + Remember Me Özelliği
router.post("/login", async (req, res) => {
    const { mail_adress, password, rememberMe } = req.body;

    if (!mail_adress || !password) {
        return res.status(400).json({ success: false, error: "E-mail and password are required." });
    }

    try {
        const user = await User.findOne({ mail_adress });
        if (!user) {
            return res.status(400).json({ success: false, error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }

        // Eğer "Remember Me" seçilmişse token süresi 7 gün olur, aksi halde 1 saat olur
        const tokenExpiry = rememberMe ? "7d" : "1h";
        
        const token = jwt.sign(
            { id: user._id, mail_adress: user.mail_adress },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        res.json({ 
            success: true, 
            message: "Login successful", 
            token,
            expiresIn: tokenExpiry // Kullanıcıya token süresini de döndür
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



router.post("/forgot-password", async (req, res) => {
    const { mail_adress } = req.body;

    if (!mail_adress) {
        return res.status(400).json({ success: false, error: "E-mail is required." });
    }

    try {
        const user = await User.findOne({ mail_adress });
        if (!user) {
            return res.status(400).json({ success: false, error: "User not found." });
        }

        const resetToken = jwt.sign(
            { id: user._id, mail_adress: user.mail_adress },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        user.resetPasswordToken = resetToken;
        await user.save();

        res.json({ success: true, message: "Password reset token stored in database." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reset Password Route (Now Secure)
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: "Token and new password are required." });
    }
    try {
        // Decode and verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user with matching reset token
        const user = await User.findOne({ _id: decoded.id, resetPasswordToken: token });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid or expired token." });
        }
        // Hash the new password and update in the database
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear the reset token to prevent reuse
        user.resetPasswordToken = null;
        await user.save();

        res.json({ success: true, message: "Password successfully reset." });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logout 
router.post("/logout", (req, res) => {
    res.json({ success: true, message: "User logged out successfully." });
});


module.exports=router;