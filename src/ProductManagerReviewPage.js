// src/ProductManagerReviewPage.js
import { useParams, useNavigate } from "react-router-dom";
import ProductReviewAdmin from "./ProductReviewAdmin";

export default function ProductManagerReviewPage() {
  const { productId } = useParams();
  const navigate      = useNavigate();
  const token         = localStorage.getItem("adminToken");

  if (!token) {
    navigate("/home");
    return null;
  }

  return (
    <div style={{ padding: "32px clamp(16px,4vw,64px)" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1>Pending Reviews for Product</h1>
      <ProductReviewAdmin productId={productId} token={token} />
    </div>
  );
}