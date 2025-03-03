import React, { useState } from "react";
import "./AuthModal.css"; // Stil dosyasını da eklemeliyiz.

function AuthModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    alert("Login Successful (Test amaçlı)");
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Şifreler uyuşmuyor!");
      return;
    }
    alert("Sign Up Successful (Test amaçlı)");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        
        <div className="tabs">
          <button className={activeTab === "login" ? "active" : ""} onClick={() => setActiveTab("login")}>Login</button>
          <button className={activeTab === "signup" ? "active" : ""} onClick={() => setActiveTab("signup")}>Sign Up</button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Giriş Yap</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <input type="text" placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="tel" placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" placeholder="Şifre Tekrar" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type="submit">Kayıt Ol</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
