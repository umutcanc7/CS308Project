// src/Receipt.js
import React from "react";
import { Link } from "react-router-dom";
import "./Receipt.css"; // Optional: for styling

function Receipt() {
  return (
    <div className="receipt-page" style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🎉 Thank You for Your Purchase!</h2>
      <p>Your order has been successfully recorded.</p>
      <p>Check your <Link to="/purchased-products">purchased products</Link> to track delivery status.</p>
      <Link to="/shop" className="back-to-shop-btn">Continue Shopping</Link>
    </div>
  );
}

export default Receipt;
