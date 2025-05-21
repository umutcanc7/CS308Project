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

    const trimmedComment = comment.trim(); // ✅ remove spaces

    if (!rating && !trimmedComment) {
      alert("Please provide at least a rating or a comment.");
      return;
    }

    if (trimmedComment && (!rating || rating < 1 || rating > 5)) {
      alert("A valid rating is required to post a comment.");
      return;
    }

    const result = await submitReview(productId, rating, trimmedComment); // ✅ send trimmed version

    if (result.success) {
      alert("✅ Review submitted!");
      navigate("/shop");
    } else {
      alert("❌ " + (result.error || "Failed to submit review."));
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          onClick={() => setRating(i)}
          style={{
            fontSize: "2rem",
            color: i <= rating ? "#ffcc00" : "#ccc",
            cursor: "pointer",
            transition: "color 0.2s",
            marginRight: "4px",
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0EAD6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "750px",
          backgroundColor: "#fff",
          padding: "3rem 10rem",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          border: "2px solid black",
        }}
      >
        <h2
          style={{
            fontSize: "40px",
            textAlign: "center",
            marginBottom: "2.5rem",
            fontWeight: "700",
            color: "#2c2c2c",
          }}
        >
          📝 Write a Review
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#333" }}>
            Rating (1–5):<br />
            <div style={{ marginTop: "0.5rem" }}>{renderStars()}</div>
          </div>

          <label
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#333",
              width: "100%",
            }}
          >
            Comment:
            <textarea
              rows="5"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.75rem",
                fontSize: "1.25rem",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #000",
                resize: "vertical",
                minHeight: "150px",
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              backgroundColor: "#2e8b57",
              color: "#fff",
              padding: "1.2rem",
              fontSize: "1.25rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#246b47")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#2e8b57")}
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReviewPage;
