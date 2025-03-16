// src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import AuthModal from "./AuthModal";
import Home from "./Home";
import Shop from "./Shop";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");
  // Initialize authentication state based on token presence
  const [isSignedIn, setIsSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsSignedIn(true);
    }
  }, []);

  // Listen for local storage changes across tabs (e.g. sign out) 
  // Bu sayede bir başka tab'de sign out yapılırsa otomatik olarak tüm tab'lerden sign out yapılıyor
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
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home openModal={openModal} />} />
        <Route
          path="/shop"
          element={
            <Shop openModal={openModal} isSignedIn={isSignedIn} signOut={signOut} />
          }
        />
      </Routes>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultActiveTab={modalTab}
        setIsSignedIn={setIsSignedIn}
      />
    </div>
  );
}

export default App;
