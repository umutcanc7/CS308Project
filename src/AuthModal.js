import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext"; // Import refreshCart from cart context
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, defaultActiveTab = "login", setIsSignedIn, openModal }) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { refreshCart } = useCart(); // used to load backend cart after merging

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

  // Merge local cart with server-side cart.
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
        const mergeResponse = await fetch("http://localhost:5001/cart/merge", {
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
      // Basic validation
      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address");
        return;
      }

      const response = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          mail_adress: email.trim(), 
          password: password.trim(), 
          rememberMe 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        
        try {
          // Fetch user profile data
          const profileResponse = await fetch("http://localhost:5001/user/profile", {
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Accept": "application/json"
            }
          });
          
          if (!profileResponse.ok) {
            throw new Error("Failed to fetch profile data");
          }
          
          const profileData = await profileResponse.json();
          if (profileData.success) {
            localStorage.setItem("userData", JSON.stringify(profileData.data));
          }

          alert("Login Successful");
          setIsSignedIn(true);
          await mergeCart(data.token);
          await refreshCart();
          resetForm();
          onClose();
          navigate("/shop");
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          // Still proceed with login even if profile fetch fails
          setIsSignedIn(true);
          await mergeCart(data.token);
          await refreshCart();
          resetForm();
          onClose();
          navigate("/shop");
        }
      } else {
        // Handle specific error messages from the server
        const errorMessage = data.message || "Invalid email or password";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (!navigator.onLine) {
        alert("Please check your internet connection");
      } else {
        alert("Server error. Please try again later");
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!fullName || !email || !password || !confirmPassword) {
        alert("Please fill in all required fields");
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }

      const response = await fetch("http://localhost:5001/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: fullName.trim(),
          mail_adress: email.trim(),
          password: password.trim(),
          phone_number: phone.trim(),
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);

        try {
          const profileResponse = await fetch("http://localhost:5001/user/profile", {
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Accept": "application/json"
            }
          });
          
          if (!profileResponse.ok) {
            throw new Error("Failed to fetch profile data");
          }
          
          const profileData = await profileResponse.json();
          if (profileData.success) {
            localStorage.setItem("userData", JSON.stringify(profileData.data));
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          // Continue with registration even if profile fetch fails
        }

        alert("User registered successfully!");
        setIsSignedIn(true);
        await mergeCart(data.token);
        await refreshCart();
        resetForm();
        onClose();
        navigate("/shop");
      } else {
        const errorMessage = data.message || "Registration failed. Please try again.";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (!navigator.onLine) {
        alert("Please check your internet connection");
      } else {
        alert("Server error. Please try again later");
      }
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