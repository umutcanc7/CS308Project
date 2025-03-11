import React, { useState, useEffect } from "react";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, defaultActiveTab = "login" }) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultActiveTab);
    }
  }, [defaultActiveTab, isOpen]);

  const handleLogin = (e) => {
    e.preventDefault();
    alert("Login Successful (For testing purposes)");
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Sign Up Successful (For testing purposes)");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          &times;
        </span>

        <div className="tabs">
          <button
            className={activeTab === "login" ? "active login-active" : ""}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={activeTab === "signup" ? "active signup-active" : ""}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Log In</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit">Sign Up</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
