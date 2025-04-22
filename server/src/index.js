// .env dosyasındaki değişkenleri yüklemek için dotenv'i dahil et
require('dotenv').config();

// Mongo URI'yi kontrol etmek için konsola yazdır
console.log('Mongo URI:', process.env.MONGO_URI);  // Mongo URI'sini konsola yazdır

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config');  // MongoDB bağlantısını dahil et

const app = express();


// MongoDB'yi bağla
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // JSON verileri işlemek için
app.use(express.urlencoded({ extended: true })); // Form verilerini almak için
app.set('view engine', 'ejs');
app.use(express.static('public')); // Static files

// API'leri dahil et
const authRoutes = require('./routes/auth');    
app.use('/auth', authRoutes);

const productRoutes = require('./routes/products'); // Ürün router'ını dahil et
app.use('/products', productRoutes); // /products altında kullanılsın

const reviewRoutes = require('./routes/reviews'); // Yorum router'ını dahil et
app.use('/reviews', reviewRoutes); // /reviews altında kullanılsın

const cartRoutes = require('./routes/cart'); // Sepet router'ını dahil et
app.use('/cart', cartRoutes); // /cart altında kullanılsın

const purchaseRoutes = require('./routes/purchase'); // Satın alma router'ını dahil et
app.use('/purchase', purchaseRoutes);



// Routes for frontend pages
app.get('/', (req, res) => {
    res.render('login'); // Default page
});

app.get('/login', (req, res) => {
    res.render('login'); // Renders login.ejs
});

app.get('/signup', (req, res) => {
    res.render('signup'); // Renders signup.ejs
});

const wishlistRoutes = require("./routes/wishlist");
app.use("/wishlist", wishlistRoutes);

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`🚀 Server running on Port: ${port}`);
});