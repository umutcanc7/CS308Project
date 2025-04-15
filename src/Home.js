// src/Home.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from "./Menu";
import logo from "./assets/logo.png";
import collection1 from "./assets/collection1.jpg";
import collection2 from "./assets/collection2.jpg";
import asset2 from "./assets/asset2.jpg";
import "./Home.css";

function Home({ openModal }) {
  const navigate = useNavigate();
  const [newProducts, setNewProducts] = useState([]);

  useEffect(() => {
    // Fetch products from your backend
    fetch('http://localhost:5001/products/sort?by=name&order=asc')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Get the most recent products
          setNewProducts(data.data.slice(0, 4));
        }
      })
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="home">
      {/* Render the Menu component at top left */}
      <Menu openModal={openModal} />

      {/* Logo in the center */}
      <header className="home-header">
        <img src={logo} alt="Logo" className="app-logo" />
      </header>

      {/* Auth links at top right */}
      <div className="auth-links">
        <span onClick={() => openModal("login")}>Login/Sign Up</span>
      </div>

      <div className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>NEW<br />COLLECTION</h1>
            <p>Summer<br />2024</p>
            <button onClick={() => navigate('/shop')} className="go-to-shop">
              Go To Shop
              <span className="arrow">→</span>
            </button>
          </div>
          <div className="hero-images">
            <div className="image-slider">
              <img src={collection1} alt="Collection preview 1" />
              <img src={collection2} alt="Collection preview 2" />
            </div>
            <div className="slider-controls">
              <button className="prev">←</button>
              <button className="next">→</button>
            </div>
          </div>
        </section>

        {/* New This Week Section */}
        <section className="new-this-week">
          <div className="section-header">
            <h2>NEW<br />THIS WEEK</h2>
            <span className="product-count">(50)</span>
          </div>

          <div className="product-grid">
            {newProducts.map((product) => (
              <div 
                key={product._id} 
                className="product-card"
                onClick={() => navigate(`/product/${product._id}`)}
              >
                <div className="product-image">
                  <img src={asset2} alt={product.name} />
                </div>
                <div className="product-info">
                  <div className="product-type">{product.category}</div>
                  <h3>{product.name}</h3>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
                <button className="quick-add">+</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
