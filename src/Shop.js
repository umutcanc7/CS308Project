// src/Shop.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Shop.css";
import { useCart } from "./CartContext";
import heartIcon from "./assets/heart.png";
import cartIcon from "./assets/cart.png";

function Shop({ openModal, isSignedIn, signOut }) {
  const { addToCart, getTotalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortOption, setSortOption] = useState("name_asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const getImage = (imageName) => {
    try {
      return require(`./assets/${imageName}`);
    } catch {
      return require("./assets/logo.png");
    }
  };

  useEffect(() => {
    const [by, order] = sortOption.split("_");
    fetch(`http://localhost:5001/products/sort?by=${by}&order=${order}`)
      .then((r) => r.json())
      .then((d) => d.success && setProducts(d.data))
      .catch(console.error);
  }, [sortOption]);

  useEffect(() => {
    fetch("http://localhost:5001/products/categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.data))
      .catch(console.error);
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="shop-page">
      <Menu />

      <div className="auth-links">
        {isSignedIn ? (
          <>
            <img
              src={heartIcon}
              alt="Wishlist"
              className="icon"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/wishlist")}
            />
            <div className="cart-icon-container" onClick={() => navigate("/cart")}>
              <img src={cartIcon} alt="Cart" className="icon" />
              {getTotalItems() > 0 && <span className="cart-count">{getTotalItems()}</span>}
            </div>
            <span className="auth-button" onClick={() => navigate("/purchased-products")}>
              My Purchases
            </span>
            <span className="signout-button" onClick={() => { signOut(); clearCart(); }}>
              Sign Out
            </span>
          </>
        ) : (
          <>
            <div className="cart-icon-container" onClick={() => navigate("/cart")}>
              <img src={cartIcon} alt="Cart" className="icon" />
            </div>
            <span onClick={() => openModal("login")}>Login/Sign Up</span>
          </>
        )}
      </div>

      <header className="shop-header">
        <h2>Our Collection</h2>
        <p>Discover our exclusive range of apparel and accessories.</p>

        <div className="shop-controls">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>

          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="name_asc">A to Z</option>
            <option value="name_desc">Z to A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="products">
        {filteredProducts.map((p) => (
          <div key={p._id} className="product-card">
            <div
              className="product-image-container"
              onClick={() => navigate(`/product/${p._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img src={getImage(p.image1)} alt={p.name} className="product-image" />
            </div>
            <h3 onClick={() => navigate(`/product/${p._id}`)} style={{ cursor: "pointer" }}>
              {p.name}
            </h3>
            <p className="product-price">${p.price.toFixed(2)}</p>
            <p className="product-description">{p.category}</p>

            <button
              className="add-to-cart-btn"
              onClick={() => addToCart({ ...p, id: p._id, image: p.image1 })}
              disabled={p.stock < 1}
            >
              {p.stock < 1 ? "OUT OF STOCK" : "Add to Cart"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Shop;
