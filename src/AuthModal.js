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
  const [rememberMe, setRememberMe] = useState(false);

  // Key for local cart in localStorage
  const CART_STORAGE_KEY = "shopping_cart";

  const navigate = useNavigate();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhone("");
    setRememberMe(false);
  };

  // Merge local cart with server-side cart
  const mergeCart = async (token) => {
    try {
      const localCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!localCart) return;

      const parsedCart = JSON.parse(localCart);
      const itemsToMerge = parsedCart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      if (itemsToMerge.length > 0) {
        const mergeResponse = await fetch("http://localhost:5000/cart/merge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
          },
          body: JSON.stringify({ items: itemsToMerge }),
        });
        if (mergeResponse.ok) {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error merging cart:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail_adress: email, password, rememberMe }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Login Successful");
        setIsSignedIn(true);
        await mergeCart(data.token);
        resetForm();
        onClose();
        navigate("/shop");
      } else {
        console.error("Login error:", data);
        alert(data.message || "An error occurred during login");
      }
    } catch (error) {
      console.error("Error during login fetch:", error);
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
      const response = await fetch("http://localhost:5000/auth/register", {
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
        localStorage.setItem("token", data.token);
        alert("User registered successfully!");
        setIsSignedIn(true);
        await mergeCart(data.token);
        resetForm();
        onClose();
        navigate("/shop");
      } else {
        console.error("Sign up error:", data);
        alert(data.message || "An error occurred during sign up");
      }
    } catch (error) {
      console.error("Error during sign up fetch:", error);
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
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember Me</label>
            </div>
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
