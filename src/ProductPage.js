// src/ProductPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import './ProductPage.css';

function ProductPage({ openModal, isSignedIn, signOut }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, getTotalItems, clearCart, cart, updateQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [mainImage, setMainImage] = useState(0);
  const [isWishlisted, setWishlisted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = async () => {
    if (!isSignedIn) {
      setWishlistCount(0);
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5001/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.data.length);
        if (window.updateWishlistCount) window.updateWishlistCount();
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
  }, [isSignedIn]);

  useEffect(() => {
    fetch('http://localhost:5001/products/sort?by=name&order=asc')
      .then(res => res.json())
      .then(data => data.success && setProducts(data.data))
      .catch(console.error);

    fetch(`http://localhost:5001/reviews/${productId}`)
      .then(res => res.json())
      .then(data => data.success && setReviews(data.data))
      .catch(console.error);

    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5001/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const exists = data.data.some(item => {
              const id = item.productId?._id || item.productId;
              return String(id) === String(productId);
            });
            setWishlisted(exists);
          }
        })
        .catch(console.error);
    }
  }, [productId]);

  const getImage = (imageName) => {
    try {
      return require(`./assets/${imageName}`);
    } catch {
      return require('./assets/logo.png');
    }
  };

  const product = products.find(p => p._id === productId);
  if (!product) return <div className="loading">Loading...</div>;

  const productImages = [
    getImage(product.image1),
    getImage(product.image2),
    getImage(product.image3),
  ];

  const toggleWishlist = async () => {
    if (!isSignedIn) return;
    const token = localStorage.getItem("token");

    if (!isWishlisted) {
      try {
        const res = await fetch("http://localhost:5001/wishlist/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (data.success) {
          setWishlisted(true);
          fetchWishlistCount();
        } else {
          alert(`❌ ${data.message}`);
        }
      } catch (err) {
        console.error("Failed to add to wishlist:", err);
      }
    } else {
      try {
        const res = await fetch(`http://localhost:5001/wishlist/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setWishlisted(false);
          fetchWishlistCount();
        } else {
          alert(`❌ ${data.message}`);
        }
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
      }
    }
  };

  return (
    <div className="modern-product-page">
      <div className="auth-links">
        {isSignedIn ? (
          <>
            <div className="auth-button" onClick={() => navigate("/wishlist")}>❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</div>
            <div className="auth-button" onClick={() => navigate("/cart")}>🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}</div>
            <div className="auth-button" onClick={() => navigate("/profile")}>👤 Profile</div>
            <div className="auth-button" onClick={() => navigate("/purchased-products")}>📦 My Purchases</div>
            <div className="auth-button signout-button" onClick={() => { signOut(); clearCart(); }}>🚪 Sign Out</div>
          </>
        ) : (
          <>
            <div className="auth-button" onClick={() => navigate("/cart")}>🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}</div>
            <div className="auth-button" onClick={() => openModal("login")}>🔐 Login / Sign Up</div>
          </>
        )}
      </div>

      <div className="product-layout">
        <div className="product-gallery">
          <div className="main-image">
            <img src={productImages[mainImage]} alt={product.name} />
          </div>
          <div className="thumbnail-list">
            {productImages.map((img, i) => (
              <div
                key={i}
                className={`thumbnail ${mainImage === i ? 'active' : ''}`}
                onClick={() => setMainImage(i)}
              >
                <img src={img} alt={`${product.name} view ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>
          <div className="price">${product.price.toFixed(2)}</div>

          {isSignedIn ? (
            <button
              className={`wishlist-btn ${isWishlisted ? "hearted" : "unhearted"}`}
              onClick={toggleWishlist}
            >
              {isWishlisted ? "♥ Remove from Wishlist" : "♡ Add to Wishlist"}
            </button>
          ) : (
            <p
              className="wishlist-login-text"
              style={{ color: "#d00", fontWeight: "bold", cursor: "pointer", marginBottom: "10px" }}
              onClick={() => openModal("login")}
            >
              🔒 Login to add to wishlist
            </p>
          )}

          <p className="description">{product.description}</p>

          <button
            className="add-button"
            disabled={product.stock < 1}
            onClick={() => {
              const existingItem = cart.find(item => item.id === product._id);
              const currentCartQuantity = existingItem?.quantity || 0;
              if (currentCartQuantity + 1 > product.stock) {
                alert(`❌ Cannot add more items. Only ${product.stock} available in stock.`);
                return;
              }
              if (existingItem) {
                updateQuantity(product._id, currentCartQuantity + 1);
              } else {
                addToCart({ ...product, id: product._id });
              }
              alert("✅ Product added to cart successfully!");
            }}
          >
            {product.stock < 1 ? 'OUT OF STOCK' : 'ADD'}
          </button>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        {reviews.length ? (
          <>
            <div className="average-rating">
              <span className="star-symbol">★</span>
              <span className="rating-number">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
            </div>
            <div className="reviews-list">
              {reviews.map(r => (
                <div key={r._id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{r.userName}</span>
                    <div className="review-rating">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`star ${i < r.rating ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-reviews">Be the first to review this product</p>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
