// App.js
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import AuthModal from "./AuthModal";
import Menu from "./Menu";
import Shop from "./Shop";
import logo from "./assets/logo.png";
import ResetPassword from "./ResetPassword"; // Newly added import

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");

  const openModal = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className="App">
      <Menu />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <header className="App-header">
                <img src={logo} alt="Logo" className="app-logo" />
              </header>
              <div className="auth-links">
                <span onClick={() => openModal("login")}>Login</span> |{" "}
                <span onClick={() => openModal("signup")}>Sign Up</span>
              </div>
            </>
          }
        />
        <Route path="/shop" element={<Shop />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/* New route */}
      </Routes>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultActiveTab={modalTab}
      />
    </div>
  );
}

export default App;
