// src/Shop.js
import React from "react";
import Menu from "./Menu";
import "./Shop.css";
// Import your image files
import heartIcon from "./assets/heart.png";
import cartIcon from "./assets/cart.png";

function Shop({ openModal, isSignedIn, signOut }) {
  return (
    <div className="shop-page">
      <Menu />
      
      <div className="auth-links">
        {isSignedIn ? (
          <>
            <img src={heartIcon} alt="Favorites" className="icon heart-icon" />
            <img src={cartIcon} alt="Cart" className="icon cart-icon" />
            <span className="signout-button" onClick={signOut}>
              Sign Out
            </span>
          </>
        ) : (
          <>
            <img src={cartIcon} alt="Cart" className="icon cart-icon" />
            <span onClick={() => openModal("login")}>Login/Sign Up</span>
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
