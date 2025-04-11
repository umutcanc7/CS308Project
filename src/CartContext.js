// src/CartContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'shopping_cart';
const CartContext = createContext();

const API_URL = 'http://localhost:5001/cart';

export const CartProvider = ({ children }) => {
  // If not logged in, load the initial cart from localStorage.
  const initialToken = localStorage.getItem("token");
  const initialCart = initialToken ? [] : JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const [cart, setCart] = useState(initialCart);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to load cart from the backend when logged in.
  const loadCartFromBackend = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const items = data.data.map((item) => ({
          id: item.productId._id,
          name: item.productId.name,
          image: item.productId.image,
          price: item.productId.price,
          quantity: item.quantity,
        }));

        setCart(items);
        console.log("🛒 Cart loaded from backend:", items);
      } else {
        console.warn("Failed to load cart from backend:", data.error);
      }
    } catch (error) {
      console.error("Error loading cart from backend:", error);
    }
  };

  // Expose refreshCart to be called from other components (e.g., AuthModal)
  const refreshCart = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await loadCartFromBackend();
    } else {
      const localCartData = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
      setCart(localCartData);
    }
  };

  // On mount, if the user is logged in, load the cart from the backend.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadCartFromBackend().finally(() => setIsInitialized(true));
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage for persistence when not logged in.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = async (product) => {
    if (!product || !product.id) return;
    const token = localStorage.getItem("token");

    if (!token) {
      // Update local cart state when not logged in.
      setCart(prevCart => {
         const existing = prevCart.find(item => item.id === product.id);
         if (existing) {
           return prevCart.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
           );
         } else {
           return [...prevCart, { ...product, quantity: 1 }];
         }
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await loadCartFromBackend();
      } else {
        console.error("Add to cart failed:", data.error);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
      } else {
        console.error("Failed to remove item from backend cart");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(productId);
    const token = localStorage.getItem("token");
    if (!token) {
      setCart(prevCart =>
         prevCart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
         )
      );
      return;
    }

    try {
      await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      setCart(prevCart =>
         prevCart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
         )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const getTotalItems = () =>
    cart.reduce((total, item) => total + (item.quantity || 0), 0);

  const getTotalPrice = () =>
    cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalItems,
        getTotalPrice,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);