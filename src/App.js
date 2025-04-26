// src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CartProvider } from "./CartContext";

import AuthModal            from "./AuthModal";
import UserBar              from "./UserBar";
import Home                 from "./Home";
import Shop                 from "./Shop";
import Cart                 from "./Cart";
import ReviewPage           from "./ReviewPage";
import ProductPage          from "./ProductPage";
import WishlistPage         from "./WishlistPage";
import PurchasedProductsPage from "./PurchasedProductsPage";
import ProductReviewsPage   from "./ProductReviewsPage";
import CreditCardForm       from "./CreditCardForm";
import ProfilePage          from "./ProfilePage";
import Receipt              from "./Receipt";

import "./App.css";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab,    setModalTab]    = useState("login");
  const [isSignedIn,  setIsSignedIn]  = useState(false);
  const navigate = useNavigate();

  /* ---------- Auth sync ---------- */
  useEffect(()=>{
    if (localStorage.getItem("token")) setIsSignedIn(true);
  },[]);
  useEffect(()=>{
    const onStorage = e=>{
      if (e.key==="token" && !e.newValue) setIsSignedIn(false);
    };
    window.addEventListener("storage", onStorage);
    return ()=>window.removeEventListener("storage", onStorage);
  },[]);

  /* ---------- Modal helpers ---------- */
  const openModal = tab => { setModalTab(tab); setIsModalOpen(true); };
  const signOut   = ()=>{ localStorage.removeItem("token"); setIsSignedIn(false); navigate("/home"); };

  /* ---------- Routes ---------- */
  return (
    <CartProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route path="/home" element={<Home openModal={openModal} />} />
          <Route path="/shop" element={<Shop isSignedIn={isSignedIn} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/review/:productId" element={<ReviewPage />} />
          <Route
            path="/product/:productId"
            element={<ProductPage openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />}
          />
          <Route
            path="/wishlist"
            element={<WishlistPage isSignedIn={isSignedIn} signOut={signOut} />}
          />
          <Route
            path="/purchased-products"
            element={<PurchasedProductsPage isSignedIn={isSignedIn} signOut={signOut} />}
          />
          <Route path="/product-reviews/:productId" element={<ProductReviewsPage />} />
          <Route path="/credit-card-form" element={<CreditCardForm />} />
          <Route
            path="/profile"
            element={<ProfilePage isSignedIn={isSignedIn} signOut={signOut} />}
          />

          {/* 🔑  NEW: parameterised receipt route */}
          <Route path="/receipt/:orderId" element={<Receipt />} />

          {/* (optional) keep the old path alive so existing bookmarks don’t 404 */}
          <Route path="/receipt" element={<Navigate to="/home" replace />} />
        </Routes>

        {/* top bar & auth modal */}
        <UserBar  isSignedIn={isSignedIn} openModal={openModal} signOut={signOut} />
        <AuthModal
          isOpen={isModalOpen}
          onClose={()=>setIsModalOpen(false)}
          defaultActiveTab={modalTab}
          setIsSignedIn={setIsSignedIn}
        />
      </div>
    </CartProvider>
  );
}