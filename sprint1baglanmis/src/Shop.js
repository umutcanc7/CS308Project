// src/Shop.js
import React from "react";
import Menu from "./Menu";
import "./Shop.css";

function Shop({ openModal, isSignedIn, signOut }) {
  return (
    <div className="shop-page">
      <Menu />
      
      <div className="auth-links">
        {isSignedIn ? (
          <>
            <span className="heart-icon">❤️</span>
            <span className="cart-icon">🛒</span>
            <span className="signout-button" onClick={signOut}>
              Sign Out
            </span>
          </>
        ) : (
          <>
            <span onClick={() => openModal("login")}>Login/Sign Up</span>
            <span className="cart-icon">🛒</span>
          </>
        )}
      </div>

      <header className="shop-header">
        <h2>Our Collection</h2>
        <p>Discover our exclusive range of apparel and accessories.</p>
      </header>
      <section className="products">
        {/* ... product items ... */}
      </section>
    </div>
  );
}

export default Shop;
