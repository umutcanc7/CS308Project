// Shop.js
import React from "react";
import "./Shop.css";

function Shop() {
  return (
    <div className="shop-page">
      <header className="shop-header">
        <h2>Our Collection</h2>
        <p>Discover our exclusive range of apparel and accessories.</p>
      </header>
      <section className="products">
        <div className="product">
          <img src="https://via.placeholder.com/200" alt="Product 1" />
          <h3>Product 1</h3>
          <p>$49.99</p>
        </div>
        <div className="product">
          <img src="https://via.placeholder.com/200" alt="Product 2" />
          <h3>Product 2</h3>
          <p>$59.99</p>
        </div>
        <div className="product">
          <img src="https://via.placeholder.com/200" alt="Product 3" />
          <h3>Product 3</h3>
          <p>$39.99</p>
        </div>
        <div className="product">
          <img src="https://via.placeholder.com/200" alt="Product 4" />
          <h3>Product 4</h3>
          <p>$39.99</p>
        </div>
      </section>
    </div>
  );
}

export default Shop;