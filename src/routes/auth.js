const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
            process.env.JWT_SECRET || "your_jwt_secret",
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

module.exports = router;
