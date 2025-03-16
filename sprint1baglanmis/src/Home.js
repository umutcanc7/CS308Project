// src/Home.js

import React from "react";
import Menu from "./Menu";
import logo from "./assets/logo.png";
import "./Home.css";

function Home({ openModal }) {
  return (
    <div className="home-page">
      {/* Render the Menu component at top left */}
      <Menu />

      {/* Logo in the center */}
      <header className="home-header">
        <img src={logo} alt="Logo" className="app-logo" />
      </header>

      {/* Auth links at top right */}
      <div className="auth-links">
        <span onClick={() => openModal("login")}>Login/Sign Up</span>
      </div>
    </div>
  );
}

export default Home;
