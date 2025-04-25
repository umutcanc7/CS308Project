// Shop.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";
import { useCart } from "./CartContext";

function Shop({ isSignedIn }) {
  const { addToCart, getTotalItems, cart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortOption, setSortOption] = useState("name_asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* --------------------------- Fetch products & cats -------------------------- */
  useEffect(() => {
    fetch("http://localhost:5001/products/sort?by=name&order=asc")
      .then((res) => res.json())
      .then((data) => data.success && setProducts(data.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/products/categories")
      .then((res) => res.json())
      .then((data) => data.success && setCategories(data.data))
      .catch(console.error);
  }, []);

  /* ------------------------------ Image helper ------------------------------- */
  const getImage = (imageName) => {
    try {
      return require(`./assets/${imageName}`);
    } catch {
      return require("./assets/logo.png");
    }
  };

  /* --------------------------- Add-to-Cart logic ----------------------------- */
  const handleAddToCart = async (product) => {
    const existing = cart.find((item) => item.id === product._id);
    const quantity = existing?.quantity || 0;
    if (quantity + 1 > product.stock)
      return alert(`❌ Only ${product.stock} in stock.`);

    if (existing) await updateQuantity(product._id, quantity + 1);
    else
      await addToCart({
        ...product,
        id: product._id,
        image: product.image1,
      });

    alert("✅ Product added to cart!");
  };

  /* ----------------------- Search / category / sorting ----------------------- */
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
      ||p.description.toLowerCase().includes(q);
    const matchCat =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const [by, order] = sortOption.split("_");
    let valA = a[by];
    let valB = b[by];

    if (by === "averageRating") {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
    } else if (by === "name") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (order === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="shop-page">
      <header className="shop-header">
        <h2>Our Collection</h2>
        <p>Discover our exclusive range of apparel and accessories.</p>

        <div className="shop-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name_asc">A to Z</option>
            <option value="name_desc">Z to A</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="averageRating_asc">Rating: Low to High</option>
            <option value="averageRating_desc">Rating: High to Low</option>
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
        {sortedProducts.map((p) => (
          <div key={p._id} className="product-card">
            <div
              className="product-image-container"
              onClick={() => navigate(`/product/${p._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={getImage(p.image1)}
                alt={p.name}
                className="product-image"
              />
            </div>

            <h3
              onClick={() => navigate(`/product/${p._id}`)}
              style={{ cursor: "pointer" }}
            >
              {p.name}
            </h3>

            <p className="product-price">${p.price.toFixed(2)}</p>
            <p className="product-description">{p.category}</p>

            <div className="product-rating">
              {p.averageRating ? (
                <div>
                  <span className="stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`star ${
                          i < Math.round(p.averageRating) ? "filled" : ""
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="rating-count">
                    ({p.averageRating.toFixed(1)})
                  </span>
                </div>
              ) : (
                <span className="no-ratings">No reviews yet</span>
              )}
            </div>

            <div className="button-wrapper">
              <button
                className="add-to-cart-btn"
                onClick={() => handleAddToCart(p)}
                disabled={p.stock < 1}
              >
                {p.stock < 1 ? "OUT OF STOCK" : "Add to Cart"}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Shop;