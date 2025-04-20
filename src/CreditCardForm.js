import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";  // axios kullanarak API çağrısı yapıyoruz
import "./CreditCardForm.css";

function CreditCardForm() {
  const navigate = useNavigate();

  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Burada kredi kartı doğrulaması yapmıyoruz. Sadece giriş yapılmışsa, işlem başlatıyoruz.
    
    setErrorMessage(""); // Önceki hata mesajını temizliyoruz

    try {
      const orderDetails = {
        cardNumber,  // Kredi kartı bilgileri frontend'de kullanılacak
        cvv,
        expiryDate,
      };

      // API'ye sipariş kaydını gönderiyoruz
      const response = await axios.post("http://localhost:5001/api/purchase", orderDetails);

      if (response.data.success) {
        // Sipariş ID'sini localStorage'a kaydediyoruz
        localStorage.setItem("orderId", response.data.orderId);

        // Sipariş başarılı, kullanıcıyı fatura sayfasına yönlendiriyoruz
        navigate("/receipt");  // Sipariş sayfasına yönlendirme
      } else {
        setErrorMessage("There was an issue with the payment. Please try again.");
      }
    } catch (error) {
      console.error("Error during payment:", error);
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