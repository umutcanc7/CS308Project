// src/Cart.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import './Cart.css';

const images = require.context('./assets', false, /\.(png|jpe?g|webp|svg)$/);

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const [productImages, setProductImages] = useState({});

  const getImage = (imageName) => {
    if (!imageName) return images('./logo.png');
    try {
      return images(`./${imageName}`);
    } catch {
      return images('./logo.png');
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      const newMap = {};
      for (const item of cart) {
        try {
          const res = await fetch(`http://localhost:5001/products/${item.id}`);
          const data = await res.json();
          if (data.success && data.data?.image1) {
            newMap[item.id] = data.data.image1;
          }
        } catch (err) {
          console.error(`Error fetching product ${item.id}:`, err);
        }
      }
      setProductImages(newMap);
    };

    if (cart.length > 0) {
      fetchImages();
    }
  }, [cart]);

  const handleCheckout = () => {
    if (!cart.length) return alert('Cart is empty!');
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in before checkout.');

    navigate('/credit-card-form');
  };

  const handleQuantityChange = async (item, newQuantity) => {
    try {
      const response = await fetch(`http://localhost:5001/products/${item.id}`);
      const data = await response.json();

      if (data.success) {
        const currentStock = data.data.stock;
        if (newQuantity > currentStock) {
          alert(`❌ Cannot add more items. Only ${currentStock} available in stock.`);
          return;
        }
        if (newQuantity > 0) {
          updateQuantity(item.id, newQuantity);
        } else {
          removeFromCart(item.id);
        }
      } else {
        alert('❌ Error checking product stock');
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      alert('❌ Error checking product stock');
    }
  };

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((it) => (
              <div key={it.id} className="cart-item">
                <img
                  src={getImage(productImages[it.id])}
                  alt={it.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{it.name}</h3>
                  <p className="cart-item-price">${it.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(it, it.quantity - 1)}
                    disabled={it.quantity <= 1}
                  >−</button>
                  <span>{it.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(it, it.quantity + 1)}
                  >+</button>
                </div>
                <div className="cart-item-total">
                  ${(it.price * it.quantity).toFixed(2)}
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(it.id)}>
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
              <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link>
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
