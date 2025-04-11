import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitReview } from "./api/reviews";

function ReviewPage() {
  const { productId } = useParams();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || !comment) {
      alert("Please fill in both rating and comment.");
      return;
    }

    const result = await submitReview(productId, rating, comment);

    if (result.success) {
      alert("✅ Review submitted!");
      navigate("/shop");
    } else {
      alert("❌ " + (result.error || "Failed to submit review."));
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "auto" }}>
      <h2>Write a Review</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Rating (1–5):{" "}
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Comment:
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%" }}
              required
            />
          </label>
        </div>
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
}

export default ReviewPage;
