import React, { useState } from "react";
import "./App.css";
import AuthModal from "./AuthModal";

function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="App">
      {/* Sağ üst köşeye "Login | Sign Up" linkleri */}
      <div className="auth-links">
        <span onClick={() => setModalOpen(true)}>Login</span> | 
        <span onClick={() => setModalOpen(true)}> Sign Up</span>
      </div>

      {/* Başlık kısmı */}
      <header className="App-header">
        <h1>Welcome to SwagLab</h1>
        <p>Swagging up your style</p>
      </header>

      {/* Modalı çağırıyoruz */}
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default App;