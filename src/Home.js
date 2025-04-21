// Home.js
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from "./Menu";
import logo from "./assets/logo.png";
import "./Home.css";
import blue1 from "./assets/blue1.jpg";
import red1 from "./assets/red1.jpg";

function Home({ openModal, isSignedIn, signOut }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Smooth, slower scroll handler
  const handleWheel = (e) => {
    e.preventDefault();
    containerRef.current.scrollBy({
      top: e.deltaY * 0.4,
      behavior: 'smooth'
    });
  };

  return (
    <div className="home" ref={containerRef} onWheel={handleWheel}>
      {/* Top bar */}
      <div className="top-bar">
        <Menu openModal={openModal} />
        <div className="auth-links">
          {isSignedIn ? (
            <span className="signout-button" onClick={signOut}>Sign Out</span>
          ) : (
            <span onClick={() => openModal("login")}>Login/Sign Up</span>
          )}
        </div>
      </div>

      {/* Logo Section */}
      <section className="fullscreen-logo-wrapper">
        <img src={logo} alt="Logo" className="fullscreen-logo" />
      </section>

      {/* New Collection Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>NEW<br/>PRODUCT</h1>
          <p>Spring<br/>2025</p>
          <button onClick={() => navigate('/shop')} className="go-to-shop">
            Go To Shop <span className="arrow">→</span>
          </button>
        </div>
        <div className="hero-images">
          <div className="image-slider">
            <img src={blue1} alt="Blue Collection 1" />
            <img src={red1} alt="Red Collection 2" />
          </div>
          <div className="slider-controls">
            <button className="prev">←</button>
            <button className="next">→</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;