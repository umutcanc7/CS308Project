// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config');
const authRouter = require('./auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Use auth routes
app.use('/auth', authRouter);

// Start the server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`🚀 Server running on Port: ${port}`);
});
