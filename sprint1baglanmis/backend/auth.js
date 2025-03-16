// auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const router = express.Router();

// Middleware for token verification
const verifyToken = (req, res, next) => {
  // Expecting token in the Authorization header as: Bearer <token>
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  const token = authHeader.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ success: false, error: "Token format is invalid" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, error: "Unauthorized: " + err.message });
    }
    req.userId = decoded.id;
    next();
  });
};

// Register User
router.post("/register", async (req, res) => {
  const { name, password, phone_number, mail_adress } = req.body;

  console.log("Received registration request:", req.body);

  if (!name || !password || !mail_adress) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  try {
    const existingUser = await User.findOne({ mail_adress });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "E-mail already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      password: hashedPassword,
      phone_number,
      mail_adress,
    });

    await newUser.save();
    console.log("User registered successfully:", newUser);

    // Create a token upon successful registration
    const token = jwt.sign(
      { id: newUser._id, mail_adress: newUser.mail_adress },
      process.env.JWT_SECRET, // Ensure this is set in your environment
      { expiresIn: "1h" }
    );

    res.status(201).json({ success: true, message: "User registered successfully!", token });
  } catch (error) {
    console.log("Error during registration:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { mail_adress, password } = req.body;

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

    const token = jwt.sign(
      { id: user._id, mail_adress: user.mail_adress },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Example of a protected route using verifyToken middleware
router.get("/protected", verifyToken, (req, res) => {
  res.json({ success: true, message: "This is a protected route", userId: req.userId });
});

module.exports = router;
