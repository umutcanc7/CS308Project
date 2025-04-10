// backend/auth.js
require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer"); // Included if used later

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, password, phone_number, mail_adress } = req.body;

  // Basic validation
  if (!name || !password || !mail_adress) {
    return res.status(400).json({
      success: false,
      message: "Name, password, and mail_adress are required.",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ mail_adress });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "E-mail already registered!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      name,
      password: hashedPassword,
      phone_number,
      mail_adress,
    });
    await newUser.save();

    // Generate JWT token (expires in 1 hour)
    const token = jwt.sign(
      { id: newUser._id, mail_adress: newUser.mail_adress },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Respond
    res.status(201).json({ success: true, message: "User registered successfully!", token });
  } catch (error) {
    console.error("Error during /register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { mail_adress, password, rememberMe } = req.body;

  if (!mail_adress || !password) {
    return res.status(400).json({ success: false, message: "E-mail and password are required." });
  }

  try {
    const user = await User.findOne({ mail_adress });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Set token expiry based on 'Remember Me'
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
      expiresIn: tokenExpiry,
    });
  } catch (error) {
    console.error("Error during /login:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { mail_adress } = req.body;

  if (!mail_adress) {
    return res.status(400).json({ success: false, message: "E-mail is required." });
  }

  try {
    const user = await User.findOne({ mail_adress });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
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
    console.error("Error during /forgot-password:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required." });
  }
  try {
    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user with matching reset token
    const user = await User.findOne({ _id: decoded.id, resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }
    // Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    // Clear the reset token to prevent reuse
    user.resetPasswordToken = null;
    await user.save();

    res.json({ success: true, message: "Password successfully reset." });
  } catch (error) {
    console.error("Error during /reset-password:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "User logged out successfully." });
});

module.exports = router;
