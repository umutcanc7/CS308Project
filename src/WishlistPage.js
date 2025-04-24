// src/WishlistPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WishlistPage.css";

const images = require.context("./assets", false, /\.(png|jpe?g|webp|svg)$/);

const getImage = (name) => {
  try {
    return images(`./${name}`);
  } catch {
    return images("./logo.png");
  }
};

function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5001/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setWishlist(data.data);

      // ✅ Update top bar count
      if (window.updateWishlistCount) window.updateWishlistCount();
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:5001/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setWishlist((prev) =>
        prev.filter((item) => {
          const id = item.productId?._id || item.productId;
          return id !== productId;
        })
      );

      // ✅ Update top bar count
      if (window.updateWishlistCount) window.updateWishlistCount();
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <div className="wishlist-page">
      <h2>Your Wishlist</h2>

      {wishlist.length === 0 ? (
        <p className="empty">Your wishlist is empty.</p>
      ) : (
        <div className="wishlist-items">
          {wishlist.map((item) => {
            const product = typeof item.productId === "object" ? item.productId : null;
            if (!product || !product.name) return null;

            return (
              <div key={item._id} className="wishlist-card">
                <img
                  src={getImage(product.image1)}
                  alt={product.name}
                  className="wishlist-image"
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ cursor: "pointer" }}
                />
                <h3
                  onClick={() => navigate(`/product/${product._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {product.name}
                </h3>
                <p>${product.price.toFixed(2)}</p>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWishlist(product._id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
