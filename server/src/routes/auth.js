// backend/auth.js
require("dotenv").config();
const express   = require("express");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const User      = require("../models/User");
const Admin     = require("../models/Admin");
const SalesAdmin  = require("../models/SalesAdmin");   // ← NEW

const router = express.Router();

/* ───────── middleware ───────── */
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token missing" });

  // user → admin → salesAdmin
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (!err) { req.user = payload; return next(); }

    jwt.verify(token, process.env.ADMIN_JWT_SECRET, (adErr, adPayload) => {
      if (!adErr) { req.user = adPayload; return next(); }

      jwt.verify(token, process.env.SALES_ADMIN_JWT_SECRET, (saErr, saPayload) => {
        if (saErr) return res.status(403).json({ success: false, message: "Invalid token" });
        req.user = saPayload;                // sales-admin
        next();
      });
    });
  });
}

/* ───────── REGISTER ───────── */
router.post("/register", async (req, res) => {
  const { name, password, phone_number, mail_adress } = req.body;
  if (!name || !password || !mail_adress)
    return res.status(400).json({ success: false, message: "Name, password, and mail_adress are required." });

  try {
    if (await User.findOne({ mail_adress }))
      return res.status(400).json({ success: false, message: "E-mail already registered!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, password: hashedPassword, phone_number, mail_adress });

    const token = jwt.sign(
      { id: newUser._id, mail_adress: newUser.mail_adress, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ success: true, message: "User registered successfully!", token, role: "user" });
  } catch (err) {
    console.error("Error during /register:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ───────── LOGIN ───────── */
router.post("/login", async (req, res) => {
  const { mail_adress, password, rememberMe } = req.body;
  if (!mail_adress || !password)
    return res.status(400).json({ success: false, message: "E-mail and password are required." });

  try {
    const user = await User.findOne({ mail_adress });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const tokenExpiry = rememberMe ? "7d" : "1h";

    /* role & secret selection — admin → salesAdmin → user */
    let role   = "user";
    let secret = process.env.JWT_SECRET;

    if (await Admin.exists({ userId: user._id })) {
      role   = "admin";
      secret = process.env.ADMIN_JWT_SECRET;
    } else if (await SalesAdmin.exists({ userId: user._id })) {
      role   = "salesAdmin";
      secret = process.env.SALES_ADMIN_JWT_SECRET;
    }

    const token = jwt.sign(
      { id: user._id, mail_adress: user.mail_adress, role },
      secret,
      { expiresIn: tokenExpiry }
    );

    res.json({ success: true, message: "Login successful", token, role, expiresIn: tokenExpiry });
  } catch (err) {
    console.error("Error during /login:", err);
    res.status(500).json({ success: false, message: err.message });
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


// GET /auth/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name mail_adress phone_number address");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Convert field names to what frontend expects
    const transformed = {
      name: user.name,
      email: user.mail_adress,
      phoneNumber: user.phone_number,
      address: user.address
    };

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// PUT /auth/profile
router.put("/profile", authenticateToken, async (req, res) => {
  const { address } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { address },
      { new: true, runValidators: true }
    ).select("name mail_adress phone_number address");
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /auth/is-admin
router.get("/is-admin", authenticateToken, async (req, res) => {
  try {
    const isAdmin = await Admin.exists({ userId: req.user.id });
    res.json({ success: true, isAdmin: !!isAdmin });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
