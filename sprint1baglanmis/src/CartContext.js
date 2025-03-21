import React, { createContext, useContext, useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'shopping_cart';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
          console.log('Cart loaded from localStorage:', parsedCart);
        } else {
          console.warn('Saved cart is not an array, initializing empty cart');
          setCart([]);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCart([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        console.log('Cart saved to localStorage:', cart);
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isInitialized]);

  // Add item to cart
  const addToCart = (product) => {
    if (!product || !product.id) {
      console.error('Invalid product:', product);
      return;
    }

    setCart((prevCart) => {
      // Check if product already exists in cart
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Increase quantity if product already in cart
        console.log(`Increasing quantity for ${product.name}`);
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart with quantity 1
        console.log(`Adding new product to cart: ${product.name}`);
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId) => {
    if (!productId) {
      console.error('Invalid product ID:', productId);
      return;
    }
    
    setCart(prevCart => {
      console.log(`Removing product with ID ${productId} from cart`);
      return prevCart.filter(item => item.id !== productId);
    });
  };
  
  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (!productId) {
      console.error('Invalid product ID:', productId);
      return;
    }
    
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      console.log(`Updating quantity for product ID ${productId} to ${newQuantity}`);
      return prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      );
    });
  };
  
  // Calculate total items in cart
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };
  
  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  };
  
  // Clear the entire cart
  const clearCart = () => {
    console.log('Clearing the cart');
    setCart([]);
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
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
