// src/SalesManagerPage.js
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import "./SalesManagerPage.css";

export default function SalesManagerPage() {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [status,   setStatus]     = useState({ msg:"", error:false });
  const [priceEdits, setPriceEdits] = useState({});
  
  const adminToken = localStorage.getItem("adminToken");
  const navigate   = useNavigate();

/* ─────────── LOAD PENDING PRODUCTS ─────────── */
  const loadPendingProducts = async () => {
    try {
      const res = await fetch("http://localhost:5001/salesmanager/pending-products", {
        headers:{ Authorization:`Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      if (json.success) setProducts(json.data);
      else setStatus({ msg:json.msg || "Error loading products", error:true });
    } catch (e) {
      setStatus({ msg:e.message, error:true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPendingProducts(); }, []);

/* ─────────── PRICE HANDLERS ─────────── */
  const handlePriceChange = (id,val) =>
    setPriceEdits(prev => ({ ...prev, [id]: val }));

  const updatePrice = async (id) => {
    const price = Number(priceEdits[id]);
    if (isNaN(price) || price <= 0) {
      setStatus({ msg:"Price must be a positive number", error:true });
      return;
    }
    try {
      const res  = await fetch(`http://localhost:5001/salesmanager/products/${id}/price`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${adminToken}` },
        body:JSON.stringify({ price })
      });
      const json = await res.json();
      if (json.success) {
        setStatus({ msg:"Price updated successfully", error:false });
        setPriceEdits(prev => ({ ...prev, [id]: undefined }));
        setProducts(prev => prev.filter(p => p._id !== id));   // remove priced product
      } else {
        setStatus({ msg:json.msg || "Failed to update price", error:true });
      }
    } catch (e) {
      setStatus({ msg:e.message, error:true });
    }
  };

/* ─────────── RENDER ─────────── */
  if (loading) return <div className="loading-container">Loading products…</div>;

  return (
    <div className="admin-page">
      <div className="manager-header-bar">
        <h1 className="page-title">Sales Manager</h1>

        <div className="header-sections-container">
          {/* Refunds */}
          <div className="header-subsection">
            <h3 className="subheading">Refund Requests</h3>
            <button
              onClick={() => navigate("/refund-requests")}
              className="white-btn"
            >
              View Refund Requests
            </button>
          </div>

          {/* Dashboard */}
          <div className="header-subsection">
            <h3 className="subheading">Return to Dashboard</h3>
            <button
              onClick={() => navigate("/admin")}
              className="white-btn"
            >
              Back to Admin
            </button>
          </div>

          {/* NEW ► Invoices */}
          <div className="header-subsection">
            <h3 className="subheading">Invoices</h3>
            <button
              onClick={() => navigate("/sales-manager-invoices")}
              className="white-btn"
            >
              View Invoices
            </button>
          </div>
        </div>

        {status.msg && (
          <p className={status.error ? "status error" : "status ok"}>
            {status.msg}
          </p>
        )}
      </div>

      <div className="section-box">
        <h2>Products Awaiting Price Assignment</h2>

        {products.length === 0 ? (
          <p className="empty-message">No products need pricing at this time.</p>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <div className="product-card" key={product._id}>
                <div className="product-images">
                  <img
                    src={product.image1}
                    alt={product.name}
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p><strong>ID:</strong> {product.product_id}</p>
                  <p><strong>Category:</strong> {product.category}</p>
                  {product.color && <p><strong>Color:</strong> {product.color}</p>}
                  {product.description && (
                    <p><strong>Description:</strong> {product.description}</p>
                  )}
                  <p><strong>Stock:</strong> {product.stock}</p>

                  <div className="price-form">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Set price"
                      value={priceEdits[product._id] || ""}
                      onChange={e => handlePriceChange(product._id, e.target.value)}
                    />
                    <button
                      onClick={() => updatePrice(product._id)}
                      className="price-button"
                    >
                      Set Price
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}