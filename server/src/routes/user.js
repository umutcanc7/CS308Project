// src/routes/user.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Token verification middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

// GET /user/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name mail_adress phone_number address");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.mail_adress,
        phoneNumber: user.phone_number,
        address: user.address,
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /user/profile
router.put("/profile", authenticateToken, async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;

  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        mail_adress: email,
        phone_number: phoneNumber,
        address
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        name: updated.name,
        email: updated.mail_adress,
        phoneNumber: updated.phone_number,
        address: updated.address,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
