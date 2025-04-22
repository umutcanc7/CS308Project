import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CartProvider } from "./CartContext";
import AuthModal from "./AuthModal";
import Home from "./Home";
import Shop from "./Shop";
import Cart from "./Cart";
import ReviewPage from "./ReviewPage";
import ProductPage from "./ProductPage";
import WishlistPage from "./WishlistPage";
import PurchasedProductsPage from "./PurchasedProductsPage";
import ProductReviewsPage from "./ProductReviewsPage";
import CreditCardForm from "./CreditCardForm";
import ProfilePage from './ProfilePage';
import Receipt from "./Receipt"; // Adjust path if needed
import "./App.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsSignedIn(true);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "token" && !event.newValue) {
        setIsSignedIn(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const openModal = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setIsSignedIn(false);
    navigate("/home");
  };

  return (
    <CartProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/shop" element={<Shop openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/review/:productId" element={<ReviewPage />} />
          <Route path="/product/:productId" element={<ProductPage openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/wishlist" element={<WishlistPage isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/purchased-products" element={<PurchasedProductsPage isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/product-reviews/:productId" element={<ProductReviewsPage />} />
          <Route path="/credit-card-form" element={<CreditCardForm />} />
          <Route path="/profile" element={<ProfilePage isSignedIn={isSignedIn} signOut={signOut} />} />
          <Route path="/receipt" element={<Receipt />} />
        </Routes>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultActiveTab={modalTab}
          setIsSignedIn={setIsSignedIn}
        />
      </div>
    </CartProvider>
  );
}

export default App;
