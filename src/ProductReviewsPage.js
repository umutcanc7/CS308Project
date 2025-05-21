// src/ProductReviewsPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchReviews as getReviews } from "./api/reviews";
function ProductReviewsPage() {
  const { productId } = useParams();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const result = await getReviews(productId);
      if (result.success) {
        setReviews(result.data);
      } else {
        console.error("Error fetching reviews:", result.error);
      }
    };

    fetchReviews();
  }, [productId]);

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h2>Reviews for this Product</h2>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <li key={review._id} style={{ marginBottom: "1rem" }}>
              <strong>⭐ {review.rating}</strong>
              <p>{review.comment}</p>
              <small>User ID: {review.userId}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductReviewsPage;
