// src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CartProvider } from "./CartContext";

import AuthModal from "./AuthModal";
import UserBar from "./UserBar";
import Home from "./Home";
import Shop from "./Shop";
import Cart from "./Cart";
import ReviewPage from "./ReviewPage";
import ProductPage from "./ProductPage";
import WishlistPage from "./WishlistPage";
import PurchasedProductsPage from "./PurchasedProductsPage";
import ProductReviewsPage from "./ProductReviewsPage";
import CreditCardForm from "./CreditCardForm";
import ProfilePage from "./ProfilePage";
import Receipt from "./Receipt";
import OrderDetailsPage from "./OrderDetailsPage";
import ProductManagerPage from "./ProductManagerPage";
import ProductManagerPurchases from "./ProductManagerPurchases";
import SalesManagerPage from "./SalesManagerPage";
import RefundRequestsPage from "./RefundRequestsPage";
import SalesManagerInvoices from "./SalesManagerInvoices";
import AdminOrderReceipt from "./AdminOrderReceipt";
import Discount from "./discount";  // ✅ NEW IMPORT
import SalesManagerCharts from "./SalesManagerRevenue"
import ProductManagerReviewPage from "./ProductManagerReviewPage";


import "./App.css";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();

  /* ---------- Auth sync ---------- */
  useEffect(() => {
    if (
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("salesAdminToken")
    ) {
      setIsSignedIn(true);
    }
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (
        ["token", "adminToken", "salesAdminToken"].includes(e.key) &&
        !e.newValue
      ) {
        setIsSignedIn(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- Modal helpers ---------- */
  const openModal = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("salesAdminToken");
    localStorage.removeItem("showSaleNotification");
    setIsSignedIn(false);
    navigate("/home");
  };

  /* ---------- Routes ---------- */
  return (
    <CartProvider>
      <div className="App">
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home openModal={openModal} />} />
          <Route path="/shop" element={<Shop isSignedIn={isSignedIn} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/review/:productId" element={<ReviewPage />} />
          <Route
            path="/product/:productId"
            element={
              <ProductPage openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />
            }
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
          <Route path="/order/:orderId" element={<OrderDetailsPage />} />

          {/* Receipt Routes */}
          <Route path="/receipt/:orderId" element={<Receipt />} />
          <Route path="/receipt" element={<Navigate to="/home" replace />} />

          {/* Admin Routes */}
          <Route path="/product-manager-page" element={<ProductManagerPage />} />
          <Route path="/product-manager-purchases" element={<ProductManagerPurchases />} />
          <Route path="/sales-manager-page" element={<SalesManagerPage />} />
          <Route path="/refund-requests" element={<RefundRequestsPage />} />
          <Route path="/sales-manager-invoices" element={<SalesManagerInvoices />} />
          <Route path="/admin-order/:orderId" element={<AdminOrderReceipt />} />
          <Route
            path="/product-manager-reviews/:productId"
            element={<ProductManagerReviewPage />}
          />

          {/* NEW: Discount Page */}
          <Route path="/discount" element={<Discount />} />
          <Route path="/sales-manager-charts" element={<SalesManagerCharts />} />
        </Routes>

        {/* User Bar and Auth Modal */}
        <UserBar isSignedIn={isSignedIn} openModal={openModal} signOut={signOut} />
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
