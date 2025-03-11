// App.js
import React, { useState } from "react";
import "./App.css";
import AuthModal from "./AuthModal";
import Menu from "./Menu"; // Import the new Menu component
import logo from "./logo.png"; // Adjust the path as needed

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");

  const openModal = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className="App">
      {/* Render the hamburger menu */}
      <Menu />
      
      {/* Header with logo and brand details */}
      <header className="App-header">
        <img src={logo} alt="Logo" className="app-logo" />
      </header>
      

      {/* Auth links (Login / Sign Up) */}
      <div className="auth-links">
        <span onClick={() => openModal("login")}>Login</span> |{" "}
        <span onClick={() => openModal("signup")}>Sign Up</span>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultActiveTab={modalTab}
      />
    </div>
  );
}

export default App;
