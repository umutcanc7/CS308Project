// src/UserBar.js (or Menu.js)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./Menu.css";

function UserBar({ isSignedIn, openModal, signOut }) {
  const navigate = useNavigate();
  const { getTotalItems, clearCart } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  // Initial and global wishlist count fetch
  useEffect(() => {
    if (!isSignedIn) {
      setWishlistCount(0);
      return;
    }

    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5001/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setWishlistCount(data.data.length);
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
      }
    };

    fetchWishlist();

    // ✅ GLOBAL METHOD for updating wishlist count elsewhere
    window.updateWishlistCount = fetchWishlist;
  }, [isSignedIn]);

  const barStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "10px 22px",
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,.1)",
  };

  const btnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "30px",
    background: "#f5f5f5",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap",
    transition: "background .2s",
  };

  return (
    <>
      <div style={barStyle}>
        {/* New buttons on the left */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={btnStyle} onClick={() => navigate("/home")}>🏠 Home</div>
          <div style={btnStyle} onClick={() => navigate("/shop")}>🛍 Shop</div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginLeft: "auto" }}>
          {isSignedIn ? (
            <>
              <div style={btnStyle} onClick={() => navigate("/wishlist")}>❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</div>
              <div style={btnStyle} onClick={() => navigate("/cart")}>🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}</div>
              <div style={btnStyle} onClick={() => navigate("/profile")}>👤 Profile</div>
              <div style={btnStyle} onClick={() => navigate("/purchased-products")}>📦 My Purchases</div>
              <div style={{ ...btnStyle, background: "#ffebee", borderColor: "#ff6b6b" }} onClick={() => { signOut(); clearCart(); }}>🚪 Sign Out</div>
            </>
          ) : (
            <>
              <div style={btnStyle} onClick={() => navigate("/cart")}>🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}</div>
              <div style={btnStyle} onClick={() => openModal("login")}>🔐 Login / Sign Up</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default UserBar;