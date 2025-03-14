// server.js

// Import required libraries
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Assuming you have a User model
require('dotenv').config(); // Load .env variables

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // For parsing JSON requests

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected..."))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Login endpoint
app.post('/auth/login', async (req, res) => {
  console.log("Received login request:", req.body);  // Log the incoming request
  const { mail_adress, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ mail_adress });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, mail_adress: user.mail_adress },
      process.env.JWT_SECRET, // Use the secret from .env
      { expiresIn: '1h' }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "An error occurred during login" });
  }
});

// Sign-up endpoint
app.post('/auth/register', async (req, res) => {
  const { name, mail_adress, password, phone_number } = req.body;

  if (!name || !mail_adress || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ mail_adress });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "E-mail already registered!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ name, mail_adress, password: hashedPassword, phone_number });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.status(500).json({ success: false, message: "An error occurred during sign up" });
  }
});

// Start the server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`🚀 Server running on Port: ${port}`);
});