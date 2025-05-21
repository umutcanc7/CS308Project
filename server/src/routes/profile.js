// src/routes/profile.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* ────── JWT Authentication Middleware ────── */
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = { id: decoded.id };
    next();
  });
}

/* ────── GET /user/info – Return name, email, phone, address ────── */
router.get("/info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name mail_adress phone_number address");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.mail_adress,
        phoneNumber: user.phone_number || "Not provided",
        address: user.address || "Address not entered yet",
      },
    });
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ────── PUT /user/address – Update Address Only ────── */
router.put("/address", authenticateToken, async (req, res) => {
  const { address } = req.body;

  if (!address || address.trim() === "") {
    return res.status(400).json({ success: false, message: "Address cannot be empty or just spaces" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { address },
      { new: true }
    );

    res.json({
      success: true,
      message: "Address updated successfully",
      address: updatedUser.address,
    });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
