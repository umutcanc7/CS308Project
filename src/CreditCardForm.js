// src/CreditCardForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./CreditCardForm.css";

const API_BASE = (() => {
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase && envBase.trim()) return envBase.replace(/\/$/, "");
  if (window.location.hostname === "localhost") return "http://localhost:5001";
  return "";
})();

function CreditCardForm() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!cardNumber || !cvv || !expiryDate) {
      setErrorMessage("Please fill out all fields.");
      return;
    }
    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("You must be logged in to pay.");
      return;
    }

    try {
      const items = cart.map(item => ({
        productId: item.id || item._id,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
      }));

      const res = await fetch(`${API_BASE}/purchase`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      console.log("Purchase response:", data);

      if (res.ok && data.success) {
        clearCart();
        navigate("/receipt");
      } else {
        setErrorMessage(data.error || "Failed to process purchase.");
      }
    } catch (err) {
      console.error("Error during purchase:", err);
      setErrorMessage("Network error. Please try again later.");
    }
  };

  return (
    <div className="credit-card-form">
      <h2>Enter Credit Card Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cardNumber">Card Number:</label>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            maxLength="16"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cvv">CVV:</label>
          <input
            type="text"
            id="cvv"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            maxLength="3"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Expiration Date (MM/YY):</label>
          <input
            type="text"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            maxLength="5"
            placeholder="MM/YY"
            required
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit" className="pay-button">
          Pay Now
        </button>
      </form>
    </div>
  );
}

export default CreditCardForm;
