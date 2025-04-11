import React, { createContext, useContext, useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'shopping_cart';
const CartContext = createContext();

const API_URL = 'http://localhost:5000/cart';

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const token = localStorage.getItem("token");

  // Load cart from backend
  const loadCartFromBackend = async () => {
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

  // Load cart when logged in
  useEffect(() => {
    loadCartFromBackend().finally(() => setIsInitialized(true));
  }, [token]);

  // Save to localStorage for persistence
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = async (product) => {
    if (!product || !product.id) return;

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
    try {
      const response = await fetch(`${API_URL}/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      } else {
        console.error("Failed to remove item from backend cart");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(productId);

    try {
      await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      setCart((prevCart) =>
        prevCart.map((item) =>
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
