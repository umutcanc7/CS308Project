// server/src/routes/myPurchases.js
const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// Kullanıcının geçmiş siparişlerini alma
router.get('/my-purchases', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ date: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Bir hata oluştu' });
    }
});

module.exports = router;