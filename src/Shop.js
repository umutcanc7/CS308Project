// src/Shop.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Shop.css";
import { useCart } from "./CartContext";

function Shop({ openModal, isSignedIn, signOut }) {
  const { addToCart, getTotalItems, clearCart, cart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortOption, setSortOption] = useState("name_asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add function to fetch wishlist count
  const fetchWishlistCount = async () => {
    if (!isSignedIn) {
      setWishlistCount(0);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5001/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.data.length);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  // Add useEffect to fetch wishlist count
  useEffect(() => {
    fetchWishlistCount();
  }, [isSignedIn]);

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

  const handleAddToCart = async (product) => {
    try {
      // Get current cart quantity for this product
      const existingItem = cart.find(item => item.id === product._id);
      const currentCartQuantity = existingItem?.quantity || 0;
      
      // Check if adding one more would exceed stock
      if (currentCartQuantity + 1 > product.stock) {
        alert(`❌ Cannot add more items. Only ${product.stock} available in stock.`);
        return;
      }

      if (existingItem) {
        // If item exists, update its quantity
        await updateQuantity(product._id, currentCartQuantity + 1);
      } else {
        // If item doesn't exist, add it new
        await addToCart({ ...product, id: product._id, image: product.image1 });
      }
      alert("✅ Product added to cart successfully!");
      console.log("✅ Added to cart:", product.name);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("❌ Failed to add product to cart");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="shop-page">
      <Menu />

      {/* Sidebar with emoji text buttons */}
      <div className="auth-links">
        {isSignedIn ? (
          <>
            <div className="auth-button" onClick={() => navigate("/wishlist")}>
              ❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </div>

            <div className="auth-button" onClick={() => navigate("/cart")}>
              🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
            </div>

            <div className="auth-button" onClick={() => navigate("/profile")}>
              👤 Profile
            </div>

            <div className="auth-button" onClick={() => navigate("/purchased-products")}>
              📦 My Purchases
            </div>

            <div className="auth-button signout-button" onClick={() => { signOut(); clearCart(); }}>
              🚪 Sign Out
            </div>
          </>
        ) : (
          <>
            <div className="auth-button" onClick={() => navigate("/cart")}>
              🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
            </div>
            <div className="auth-button" onClick={() => openModal("login")}>
              🔐 Login / Sign Up
            </div>
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
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
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
              onClick={() => handleAddToCart(p)}
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
