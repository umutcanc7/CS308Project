import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import Menu from './Menu';
import './ProductPage.css';
import heartIcon from './assets/heart.png';
import cartIcon from './assets/cart.png';

function ProductPage({ openModal, isSignedIn, signOut }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5001/products/sort?by=name&order=asc')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.data);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });

    // Fetch reviews
    fetch(`http://localhost:5001/reviews/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.data);
        }
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
      });
  }, [productId]);

  const product = products.find(p => p._id === productId);

  if (!product) {
    return <div className="loading">Loading...</div>;
  }

  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2X'];
  const colors = ['#E5E5E5', '#999999', '#000000', '#A8D9D5', '#C7C7F9'];
  const productImages = [
    product.image,
    product.image, // You can add more image variations here
    product.image,
    product.image,
    product.image,
  ];

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <div className="modern-product-page">
      <Menu />

      <div className="product-layout">
        <div className="product-gallery">
          <div className="main-image">
            <img src={productImages[mainImage]} alt={product.name} />
          </div>
          <div className="thumbnail-list">
            {productImages.map((img, index) => (
              <div 
                key={index} 
                className={`thumbnail ${mainImage === index ? 'active' : ''}`}
                onClick={() => setMainImage(index)}
              >
                <img src={img} alt={`${product.name} view ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1>{product.name.toUpperCase()}</h1>
          <div className="price">${product.price.toFixed(2)}</div>
          <div className="tax-info">MRP incl. of all taxes</div>

          <p className="description">{product.description}</p>

          <div className="options-section">
            <div className="color-section">
              <label>Color</label>
              <div className="color-options">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`color-option ${selectedColor === index ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(index)}
                  />
                ))}
              </div>
            </div>

            <div className="size-section">
              <label>Size</label>
              <div className="size-options">
                {sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="size-help">
              <button className="find-size">FIND YOUR SIZE</button>
              <button className="measurement-guide">MEASUREMENT GUIDE</button>
            </div>
          </div>

          <button 
            className="add-button"
            onClick={() => {
              if (!selectedSize) {
                alert('Please select a size');
                return;
              }
              addToCart({ ...product, id: product._id, selectedSize, selectedColor });
            }}
          >
            ADD
          </button>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.userName}</span>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star ${star <= review.rating ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">Be the first to review this product</p>
        )}
      </div>

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
            <span 
              onClick={() => navigate('/purchased-products')} 
              style={{ cursor: 'pointer' }}
            >
              My Purchases
            </span>
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
            <span onClick={() => openModal('login')}>Login/Sign Up</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductPage; 