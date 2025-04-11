// src/Shop.js
import React from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Shop.css";
import { useCart } from "./CartContext";
import heartIcon from "./assets/heart.png";
import cartIcon from "./assets/cart.png";

function Shop({ openModal, isSignedIn, signOut }) {
  const { addToCart, getTotalItems } = useCart();
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate("/cart");
  };

  const handlePurchasesClick = () => {
    navigate("/purchased-products");
  };

  const [products, setProducts] = React.useState([]);
  const [sortOption, setSortOption] = React.useState("name_asc");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchSortedProducts = async () => {
      const [sortBy, order] = sortOption.split("_");
      try {
        const res = await fetch(`http://localhost:5000/products/sort?by=${sortBy}&order=${order}`);
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (err) {
        console.error("Error fetching sorted products:", err);
      }
    };
    fetchSortedProducts();
  }, [sortOption]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="shop-page">
      <Menu />

      <div className="auth-links">
        {isSignedIn ? (
          <>
            <img src={heartIcon} alt="Favorites" className="icon heart-icon" />
            <div className="cart-icon-container" onClick={handleCartClick}>
              <img src={cartIcon} alt="Cart" className="icon cart-icon" />
              {getTotalItems() > 0 && (
                <span className="cart-count">{getTotalItems()}</span>
              )}
            </div>
            <button onClick={handlePurchasesClick} style={{ marginRight: "1rem" }}>
              My Purchases
            </button>
            <span className="signout-button" onClick={signOut}>
              Sign Out
            </span>
          </>
        ) : (
          <>
            <div className="cart-icon-container" onClick={handleCartClick}>
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
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <img
              src={product.image || "https://via.placeholder.com/150"}
              alt={product.name}
              className="product-image"
            />
            <h3>{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-description">{product.category}</p>
            <button
              className="add-to-cart-btn"
              onClick={() => addToCart({ ...product, id: product._id })}
            >
              Add to Cart
            </button>
            <button
              className="review-btn"
              style={{ marginTop: "0.5rem" }}
              onClick={() => navigate(`/product-reviews/${product._id}`)}
            >
              See Reviews
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Shop;
