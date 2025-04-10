import React from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";
import "./Shop.css";
import { useCart } from "./CartContext";

// Import your image files
import heartIcon from "./assets/heart.png";
import cartIcon from "./assets/cart.png";

// Dummy product data (DELETE THIS SECTION LATER)
const dummyProducts = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 24.99,
    image: "https://via.placeholder.com/150",
    description: "A comfortable everyday t-shirt made with 100% cotton."
  },
  {
    id: 2,
    name: "Denim Jeans",
    price: 59.99,
    image: "https://via.placeholder.com/150",
    description: "Classic blue denim jeans with a straight fit."
  },
  {
    id: 3,
    name: "Leather Wallet",
    price: 34.99,
    image: "https://via.placeholder.com/150",
    description: "Genuine leather wallet with multiple card slots."
  },
  {
    id: 4,
    name: "Canvas Backpack",
    price: 49.99,
    image: "https://via.placeholder.com/150",
    description: "Durable canvas backpack with laptop compartment."
  }
];
// End of dummy product data

function Shop({ openModal, isSignedIn, signOut }) {
  const { addToCart, getTotalItems } = useCart();
  const navigate = useNavigate();
  
  const handleCartClick = () => {
    navigate("/cart");
  };

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
      </header>
      
      <section className="products">
        {/* Dummy products rendering (DELETE THIS SECTION LATER) */}
        {dummyProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <h3>{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-description">{product.description}</p>
            <button 
              className="add-to-cart-btn"
              onClick={() => addToCart(product)}
            >
              Add to Cart
            </button>
          </div>
        ))}
        {/* End of dummy products rendering */}
      </section>
    </div>
  );
}

export default Shop;
