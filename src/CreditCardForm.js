import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { recordPurchase } from "./api/purchase";
import "./CreditCardForm.css";

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

    // Basic card field checks (fake validation)
    if (!cardNumber || !cvv || !expiryDate) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    try {
      let successCount = 0;

      for (const item of cart) {
        const totalPrice = item.price * item.quantity;
        const response = await recordPurchase(item.id, item.quantity, totalPrice);
        console.log("Purchase Response for", item.name, "→", response); // 👈 ADD THIS LINE
      
        if (response.success) {
          localStorage.setItem("orderId", response.orderId);  // optional
          successCount++;
        } else {
          setErrorMessage(`Failed to process ${item.name}: ${response.error}`);
        }
      }

      if (successCount === cart.length) {
        clearCart();  // Empty the cart on successful payment
        navigate("/receipt");
      } else {
        setErrorMessage("Some items could not be processed.");
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      setErrorMessage("Something went wrong. Please try again.");
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
