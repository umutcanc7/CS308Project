import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PurchasedProductsPage() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch("http://localhost:5000/purchase/user", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setProducts(data.data); // Assumes productId is populated
        } else {
          console.error("Fetch failed:", data.error);
        }
      } catch (err) {
        console.error("Error loading purchases:", err);
      }
    };

    fetchPurchases();
  }, [token]);

  const goToReview = (productId) => {
    navigate(`/review/${productId}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Your Purchased Products</h2>
      {products.length === 0 ? (
        <p>You haven't purchased anything yet.</p>
      ) : (
        <ul>
          {products.map((item) => (
            <li key={item._id} style={{ marginBottom: "1rem" }}>
              <strong>{item.productId.name}</strong> — ${item.productId.price}
              <button
                style={{ marginLeft: "1rem" }}
                onClick={() => goToReview(item.productId._id)}
              >
                Write a Review
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PurchasedProductsPage;
