// Home.js
import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";
import "./Home.css";

function Home() {
  const navigate       = useNavigate();
  const containerRef   = useRef(null);

  /* ---------- category state ---------- */
  const [categories, setCategories]             = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [currentIndex, setCurrentIndex]         = useState(0);

  /* ---------- smooth scroll ---------- */
  const handleWheel = (e) => {
    e.preventDefault();
    containerRef.current.scrollBy({ top: e.deltaY * 0.4, behavior: "smooth" });
  };

  /* ---------- fetch category list ---------- */
  useEffect(() => {
    fetch("http://localhost:5001/products/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data);
          setSelectedCategory(data.data[0] || "");
        }
      })
      .catch(console.error);
  }, []);

  /* ---------- fetch products in selected category ---------- */
  useEffect(() => {
    if (!selectedCategory) return;
    fetch("http://localhost:5001/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const filtered = data.data.filter(
            (p) => p.category === selectedCategory
          );
          setCategoryProducts(filtered);
          setCurrentIndex(0);
        }
      })
      .catch(console.error);
  }, [selectedCategory]);

  /* ---------- helpers ---------- */
  const getImage = (imageName) => {
    try {
      return require(`./assets/${imageName}`);
    } catch {
      return require("./assets/logo.png");
    }
  };
  const nextProduct = () =>
    setCurrentIndex((prev) => (prev + 1) % categoryProducts.length);
  const prevProduct = () =>
    setCurrentIndex((prev) => (prev - 1 + categoryProducts.length) % categoryProducts.length);

  const currentProduct = categoryProducts[currentIndex];

  /* =============================== UI =============================== */
  return (
    <div className="home" ref={containerRef} onWheel={handleWheel}>
      {/* Full-screen logo */}
      <section className="fullscreen-logo-wrapper">
        <img src={logo} alt="Logo" className="fullscreen-logo" />
      </section>

      {/* Category hero */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Categories</h1>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-dropdown"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <button onClick={() => navigate("/shop")} className="go-to-shop">
            Go To Shop <span className="arrow">→</span>
          </button>
        </div>

        <div className="hero-product-display">
          {currentProduct ? (
            <div className="product-card">
              <img
                src={getImage(currentProduct.image1)}
                alt={currentProduct.name}
                className="product-image"
              />
              <h3>{currentProduct.name}</h3>
              <p>${currentProduct.price.toFixed(2)}</p>
            </div>
          ) : (
            <p>No products in this category</p>
          )}

          {categoryProducts.length > 1 && (
            <div className="slider-controls">
              <button onClick={prevProduct}>←</button>
              <button onClick={nextProduct}>→</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;