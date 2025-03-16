// src/AuthModal.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, defaultActiveTab = "login", setIsSignedIn }) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail_adress: email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", data.token);
        alert("Login Successful");
        setIsSignedIn(true);
        onClose();
        navigate("/shop");
      } else {
        alert(data.message || "An error occurred during login");
      }
    } catch (error) {
      alert("An error occurred during login");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch("http://localhost:5001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          mail_adress: email,
          password,
          phone_number: phone,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Assuming the registration endpoint returns a token
        localStorage.setItem("token", data.token);
        alert("User registered successfully!");
        setIsSignedIn(true);
        onClose();
        navigate("/shop");
      } else {
        alert(data.message || "An error occurred during sign up");
      }
    } catch (error) {
      alert("An error occurred during sign up");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>
          &times;
        </span>
        <div className="tabs">
          <button onClick={() => setActiveTab("login")}>Login</button>
          <button onClick={() => setActiveTab("signup")}>Sign Up</button>
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
