// src/Shop.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Shop.css";
import { useCart } from "./CartContext";
import heartIcon from "./assets/heart.png";
import cartIcon from "./assets/cart.png";
import asset2 from "./assets/asset2.jpg";

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
      return require('./assets/logo.png');
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const [sortBy, order] = sortOption.split("_");
      try {
        const res = await fetch(
          `http://localhost:5001/products/sort?by=${sortBy}&order=${order}`
        );
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (err) {
        console.error("Error fetching sorted products:", err);
      }
    };
    fetchProducts();
  }, [sortOption]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5001/products/categories");
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="shop-page">
      <Menu />

      <div className="auth-links">
        {isSignedIn ? (
          <>
            <img src={heartIcon} alt="Favorites" className="icon heart-icon" />
            <div className="cart-icon-container" onClick={() => navigate("/cart")}>
              <img src={cartIcon} alt="Cart" className="icon cart-icon" />
              {getTotalItems() > 0 && (
                <span className="cart-count">{getTotalItems()}</span>
              )}
            </div>
            <button onClick={() => navigate("/purchased-products")} style={{ marginRight: "1rem" }}>
              My Purchases
            </button>
            <span className="signout-button" onClick={() => { signOut(); clearCart(); }}>
              Sign Out
            </span>
          </>
        ) : (
          <>
            <div className="cart-icon-container" onClick={() => navigate("/cart")}>
              <img src={cartIcon} alt="Cart" className="icon cart-icon" />
              {getTotalItems() > 0 && (
                <span className="cart-count">{getTotalItems()}</span>
              )}
            </div>
            <span onClick={() => openModal("login")}>Login/Sign Up</span>
          </>
        )}
      </div>

      <header className="shop-header">
        <h2>Our Collection</h2>
        <p>Discover our exclusive range of apparel and accessories.</p>
        <div className="shop-controls">
          {/* Category dropdown */}
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="name_asc">A to Z</option>
            <option value="name_desc">Z to A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {/* Search input */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="products">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <div
              className="product-image-container"
              onClick={() => navigate(`/product/${product._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img src={getImage(product.image1)} alt={product.name} className="product-image" />
            </div>
            <h3 onClick={() => navigate(`/product/${product._id}`)} style={{ cursor: "pointer" }}>
              {product.name}
            </h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-description">{product.category}</p>
            <button
              className="add-to-cart-btn"
              onClick={() => addToCart({ ...product, id: product._id })}
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? 'OUT OF STOCK' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Shop;
