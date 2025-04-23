// src/CreditCardForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import "./CreditCardForm.css";

/* --------------------------------------------------------------------------
   🔗  Figure out where the backend lives
   -------------------------------------------------------------------------- */
const API_BASE = (() => {
  // 1️⃣  Prefer an explicit env variable if you ever add one
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase && envBase.trim()) return envBase.replace(/\/$/, ""); // strip trailing /

  // 2️⃣  If we’re on localhost:3000 (CRA) assume backend on :5001
  if (window.location.hostname === "localhost") return "http://localhost:5001";

  // 3️⃣  Otherwise same origin (works in production when the API is served by Nginx)
  return "";
})();

function CreditCardForm() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* ------------------------------------------------------------------------
     🧾  Handle the Pay-Now click
     ------------------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Simple demo-level validation
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

    let successCount = 0;

    for (const item of cart) {
      const productId = item.id || item._id;      // tolerate either key
      const totalPrice = item.price * item.quantity;

      try {
        const res = await fetch(`${API_BASE}/purchase`, {
          method: "POST",
          mode: "cors",                            // CORS pre-flight OK
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            quantity: item.quantity,
            totalPrice,
          }),
        });

        // If the backend sends HTML (e.g. 404 page) this will throw
        const data = await res.json();
        console.log("Purchase response for", item.name, "→", data);

        if (res.ok && data.success) {
          localStorage.setItem("orderId", data.orderId); // optional
          successCount++;
        } else {
          setErrorMessage(
            `Failed to process ${item.name}: ${data.error || "Unknown error"}`
          );
        }
      } catch (err) {
        console.error(`Network/parse error for ${item.name}:`, err);
        setErrorMessage(
          `Network error while processing ${item.name}. Please make sure the server is running on ${API_BASE || "the same host"} and try again.`
        );
      }
    }

    if (successCount === cart.length) {
      clearCart();
      navigate("/receipt");
    }
  };

  /* ------------------------------------------------------------------------
     💳  Render
     ------------------------------------------------------------------------ */
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