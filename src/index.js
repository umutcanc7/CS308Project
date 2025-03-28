require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config"); // MongoDB bağlantısını dahil et

const app = express();

// MongoDB'yi bağla
connectDB();

// Middleware
app.use(express.json()); // JSON verileri işlemek için
app.use(express.urlencoded({ extended: true })); // Form verilerini almak için
app.set("view engine", "ejs");
app.use(express.static("public")); // Static files

// API'leri dahil et
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const productRoutes = require("./routes/products"); // ✅ ürün router'ını dahil et
app.use("/products", productRoutes); // ✅ /products altında kullanılsın

const reviewRoutes = require("./routes/reviews"); // ✅ yorum router'ını dahil et
app.use("/reviews", reviewRoutes); // ✅ /reviews altında kullanılsın

const cartRoutes = require("./routes/cart"); // ✅ sepet router'ını dahil et
app.use("/cart", cartRoutes); // ✅ /cart altında kullanılsın

// Routes for frontend pages
app.get("/", (req, res) => {
    res.render("login"); // Default page
});

app.get("/login", (req, res) => {
    res.render("login"); // Renders login.ejs
});

app.get("/signup", (req, res) => {
    res.render("signup"); // Renders signup.ejs
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 Server running on Port: ${port}`);
});
