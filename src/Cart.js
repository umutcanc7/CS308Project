// src/Cart.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { checkoutCart } from './api/purchase'; // New function for checkout
import './Cart.css';

function Cart({ openModal }) {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const handleCheckout = async () => {
    console.log("🛒 Checkout button clicked");

    if (!cart.length) {
      alert("Cart is empty!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in before checkout.");
      if (openModal) {
        openModal("login");
      }
      return;
    }

    try {
      // Call checkoutCart with the entire cart array.
      const result = await checkoutCart(cart);
      console.log("🔁 Checkout response:", result);

      if (result.success) {
        alert("✅ Purchase successful!\nReceipt has been emailed.");
        clearCart();
      } else {
        alert("❌ Some items failed: " + result.error);
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Something went wrong during checkout.");
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/shop" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="cart-item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-quantity">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="quantity-btn">
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="quantity-btn">
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="cart-actions">
              <Link to="/shop" className="continue-shopping-btn">
                Continue Shopping
              </Link>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
