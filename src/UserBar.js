import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./Menu.css";               // reuse styling + sliding menu
                                       
/**
 * Single global bar with:
 *   • hamburger (opens sliding menu)
 *   • wishlist / cart / profile / purchases / sign-out  OR  login
 */
function UserBar({ isSignedIn, openModal, signOut }) {
  const navigate                  = useNavigate();
  const { getTotalItems, clearCart } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  /* ---------- slide-menu state ---------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* close menu when clicking outside */
  useEffect(() => {
    function handleClick(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  /* ---------- wishlist count ---------- */
  useEffect(() => {
    if (!isSignedIn) { setWishlistCount(0); return; }
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/wishlist", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => data.success && setWishlistCount(data.data.length))
      .catch(console.error);
  }, [isSignedIn]);

  /* ---------- inline styles ---------- */
  const barStyle = {
    position: "fixed",
    top: 0,                // flush against top
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

  /* ------------------------------ UI ------------------------------ */
  return (
    <>
      {/* ---------- TOP BAR ---------- */}
      <div style={barStyle}>
        {/* Hamburger */}
        <div className="hamburger-icon" onClick={() => setMenuOpen(p => !p)}>
          <span></span><span></span><span></span>
        </div>

        {/* buttons (flex-wrap keeps them neat on mobile) */}
        <div style={{display:"flex",flexWrap:"wrap",gap:"16px",marginLeft:"auto"}}>
          {isSignedIn ? (
            <>
              <div style={btnStyle} onClick={() => navigate("/wishlist")}>
                ❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </div>
              <div style={btnStyle} onClick={() => navigate("/cart")}>
                🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
              </div>
              <div style={btnStyle} onClick={() => navigate("/profile")}>
                👤 Profile
              </div>
              <div style={btnStyle} onClick={() => navigate("/purchased-products")}>
                📦 My Purchases
              </div>
              <div
                style={{ ...btnStyle, background:"#ffebee", borderColor:"#ff6b6b" }}
                onClick={() => { signOut(); clearCart(); }}
              >
                🚪 Sign&nbsp;Out
              </div>
            </>
          ) : (
            <>
              <div style={btnStyle} onClick={() => navigate("/cart")}>
                🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
              </div>
              <div style={btnStyle} onClick={() => openModal("login")}>
                🔐 Login&nbsp;/ Sign&nbsp;Up
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- SLIDING MENU ---------- */}
      <div
        ref={menuRef}
        className={`sliding-menu ${menuOpen ? "open" : ""}`}
        /* class styles are in Menu.css */
      >
        <button className="close-btn" onClick={() => setMenuOpen(false)}>&times;</button>
        <a href="/home"            className="menu-item" onClick={() => setMenuOpen(false)}>Home</a>
        <a href="/shop"            className="menu-item" onClick={() => setMenuOpen(false)}>Shop</a>
        <a href="/magazines"       className="menu-item" onClick={() => setMenuOpen(false)}>Magazines</a>
      </div>
    </>
  );
}

export default UserBar;