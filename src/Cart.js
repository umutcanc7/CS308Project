import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { recordPurchase } from './api/purchase';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const handleCheckout = async () => {
    console.log("🛒 Checkout button clicked");

    // 1. Eğer kart boşsa, checkout sayfasına gitmemeliyiz
    if (!cart.length) {
      alert("Cart is empty!");
      return;
    }

    // 2. Kullanıcı login olmamışsa, checkout sayfasına gitmemeliyiz
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in before checkout.");
      return;
    }

    // 3. Ürün verilerinde eksiklik varsa, checkout sayfasına gitmemeliyiz
    const productDataMissing = cart.some(item => !item.id || !item.price || !item.quantity);
    if (productDataMissing) {
      alert("Some product details are missing (e.g., product ID, price, or quantity). Please review your cart.");
      return;
    }

    // Eğer tüm kontroller geçerse, checkout sayfasına yönlendirebiliriz
    navigate('/credit-card-form');  // Yönlendirme yapılacak sayfa

    try {
      let successCount = 0;

      // Satın alım işlemi
      for (const item of cart) {
        const result = await recordPurchase(item.id, item.quantity);
        console.log("🔁 Purchase response:", result);

        if (result.success) {
          successCount++;
        } else {
          alert(`❌ Failed for ${item.name}: ${result.error}`);
        }
      }

      if (successCount === cart.length) {
        alert("✅ All items successfully added!");
        clearCart();
      } else if (successCount > 0) {
        alert("⚠️ Some items were purchased, but others failed.");
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
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn"
                >
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