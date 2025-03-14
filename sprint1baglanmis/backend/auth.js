const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  const { name, password, phone_number, mail_adress } = req.body;

  // Log incoming request data
  console.log("Received registration request:", req.body);

  if (!name || !password || !mail_adress) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ mail_adress });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "E-mail already registered!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      password: hashedPassword,
      phone_number,
      mail_adress,
    });

    await newUser.save();
    console.log("User registered successfully:", newUser);

    res.status(201).json({ success: true, message: "User registered successfully!" });
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
    // Find user by email
    const user = await User.findOne({ mail_adress });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user._id, mail_adress: user.mail_adress },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;