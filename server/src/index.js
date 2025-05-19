require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config'); 

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Import Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/products', productRoutes);

const reviewRoutes = require('./routes/reviews');
app.use('/reviews', reviewRoutes);

const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);

const purchaseRoutes = require('./routes/purchase');
app.use('/purchase', purchaseRoutes);

const refundRoutes = require('./routes/refund');
app.use('/api/refund', refundRoutes);

const pmRoutes = require('./routes/productmanager');
app.use('/productmanager', pmRoutes);

const salesManagerRoutes = require('./routes/salesmanager');
app.use('/salesmanager', salesManagerRoutes);

const wishlistRoutes = require('./routes/wishlist');
app.use('/wishlist', wishlistRoutes);

const profileRoutes = require('./routes/profile');
app.use('/user', profileRoutes);

// ✅ Apply Discount Route
const applyDiscountRoutes = require('./routes/applyDiscount');
app.use('/apply-discount', applyDiscountRoutes);

// Frontend Pages
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
