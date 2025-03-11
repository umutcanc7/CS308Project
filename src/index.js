const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./config"); // MongoDB bağlantısını dahil et

const app = express();


connectDB();

app.use(express.json()); 
app.set("view engine", "ejs");
app.use(express.static("public"));

// API'leri dahil et
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

const port = 5000;
app.listen(port, () => {
    console.log(`🚀 Server running on Port: ${port}`);
});
