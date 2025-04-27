const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const jwt = require("jsonwebtoken");

// 🔒 Token authentication middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ✏️ POST /reviews/:productId — Submit a review (status = pending)
router.post("/:productId", authenticateToken, async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  const trimmedComment = (comment || "").trim();

  if (!rating && !trimmedComment) {
    return res.status(400).json({ success: false, error: "At least a rating or comment is required." });
  }

  if (trimmedComment && (!rating || rating < 1 || rating > 5)) {
    return res.status(400).json({ success: false, error: "A valid rating is required to post a comment." });
  }

  try {
    const hasPurchased = await Purchase.findOne({ userId: req.user.id, productId });
    if (!hasPurchased) {
      return res.status(403).json({ success: false, error: "You can only review products you've purchased." });
    }

    const existing = await Review.findOne({ userId: req.user.id, productId });
    if (existing) {
      return res.status(400).json({ success: false, error: "You already reviewed this product." });
    }

    const review = new Review({
      userId: req.user.id,
      productId,
      rating,
      comment: trimmedComment,
      status: "pending",
    });

    await review.save();

    // ⭐ Update product average rating (ALL reviews counted, no status check)
    const allReviews = await Review.find({ productId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = allReviews.length ? (totalRating / allReviews.length) : 0;

    await Product.findByIdAndUpdate(productId, { averageRating: average });

    res.status(201).json({ success: true, message: "Review submitted and awaiting approval." });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📋 GET /reviews/:productId — Get reviews (ratings always, comments only if approved)
router.get("/:productId", async (req, res) => {
  try {
    const allReviews = await Review.find({ productId: req.params.productId });

    const response = allReviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.status === "approved" ? r.comment : null, // ⬅️ show comment only if approved
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ PATCH /reviews/:id/approve — Approve a review
router.patch("/:id/approve", authenticateToken, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "approved" });

    res.json({ success: true, message: "Review approved successfully." });
  } catch (error) {
    console.error("Error approving review:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ PATCH /reviews/:id/decline — Decline a review
router.patch("/:id/decline", authenticateToken, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "declined" });

    res.json({ success: true, message: "Review declined successfully." });
  } catch (error) {
    console.error("Error declining review:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
