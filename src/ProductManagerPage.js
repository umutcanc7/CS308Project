import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductManagerPage.css";

export default function ProductManagerPage() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ msg: "", error: false });
  const [newCat, setNewCat] = useState("");
  const [stockEdits, setStockEdits] = useState({});
  const [newProd, setNewProd] = useState({
    product_id: "",
    name: "",
    category: "",
    color: "",
    description: "",
    stock: 10,
    image1: "",
    image2: "",
    image3: ""
  });

  const adminToken = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  const load = async () => {
    const c = await fetch("http://localhost:5001/productmanager/categories").then(r => r.json());
    if (c.success) setCats(c.data);
    const p = await fetch("http://localhost:5001/productmanager/products").then(r => r.json());
    if (p.success) setProducts(p.data);
  };

  useEffect(() => { load(); }, []);

  const addCategory = async e => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setStatus({ msg: `Category "${name}" already exists.`, error: true });
      return;
    }
    const out = await fetch("http://localhost:5001/productmanager/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name })
    }).then(r => r.json());

    setStatus({ msg: out.msg || `"${name}" added ✔`, error: !out.success });
    if (out.success) { setNewCat(""); load(); }
  };

  const delCategory = async name => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const out = await fetch(`http://localhost:5001/productmanager/categories/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());

    setStatus({ msg: out.msg, error: !out.success });
    if (out.success) load();
  };

  const handleStockChange = (id, val) => setStockEdits(p => ({ ...p, [id]: val }));

  const updateStock = async id => {
    const s = Number(stockEdits[id]);
    if (isNaN(s) || s < 0) {
      setStatus({ msg: "Invalid stock value.", error: true });
      return;
    }

    const out = await fetch(`http://localhost:5001/productmanager/products/${id}/stock`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ stock: s })
    }).then(r => r.json());

    setStatus({ msg: out.msg || "Failed to update stock.", error: !out.success });
    if (out.success) {
      setStockEdits(p => ({ ...p, [id]: undefined }));
      load();
    }
  };

  const removeProduct = async id => {
    if (!window.confirm("Remove this product?")) return;
    const out = await fetch(`http://localhost:5001/productmanager/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());

    setStatus({ msg: out.msg, error: !out.success });
    if (out.success) load();
  };

  const addProduct = async e => {
    e.preventDefault();
    const { product_id, name, category, image1, image2, image3 } = newProd;
    if (!product_id || !name.trim() || !category || !image1 || !image2 || !image3) {
      setStatus({ msg: "product_id, name, category and three image fields are required.", error: true });
      return;
    }

    const payload = { ...newProd, product_id: Number(product_id) };

    const out = await fetch("http://localhost:5001/productmanager/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    setStatus({ msg: out.msg || "Product added.", error: !out.success });
    if (out.success) {
      setNewProd({
        product_id: "", name: "", category: "", color: "",
        description: "", stock: 10, image1: "", image2: "", image3: ""
      });
      load();
    }
  };

  return (
    <div className="admin-page">
      <div className="manager-header-bar">
        <h1 className="page-title">Product Manager</h1>

        <div className="header-sections-container">
          <div className="header-subsection">
            <h3 className="subheading">Customers Purchases</h3>
            <button onClick={() => navigate("/product-manager-purchases")} className="white-btn">Purchases</button>
          </div>

          <div className="header-subsection">
            <h3 className="subheading">Return to Dashboard</h3>
            <button onClick={() => navigate("/admin")} className="white-btn">Back to Admin</button>
          </div>

          <div className="header-subsection">
            <h3 className="subheading">Add New Category</h3>
            <form onSubmit={addCategory} className="add-form-centered">
              <input className="category-input"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="New category name"
              />
              <button type="submit" className="category-add-btn">Add</button>
            </form>
          </div>
        </div>

        {status.msg && <p className={status.error ? "status error" : "status ok"}>{status.msg}</p>}
      </div>

      {/* Categories Section */}
      <div className="section-box">
        <h2>Existing Categories</h2>
        <div className="cat-list-wrapper">
          <ul className="cat-list">
            {cats.map(c => (
              <li className="cat-item" key={c._id}>
                <div className="cat-name-box">{c.name}</div>
                <button className="delete-btn-box" onClick={() => delCategory(c.name)}>🗑</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add Product Section */}
      <div className="section-box">
        <h2>Add New Product</h2>
        <form onSubmit={addProduct} className="add-product-form">
          <select value={newProd.category} onChange={e => setNewProd({ ...newProd, category: e.target.value })}>
            <option value="">Select category</option>
            {cats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <input placeholder="Product ID" type="number"
            value={newProd.product_id} onChange={e => setNewProd({ ...newProd, product_id: e.target.value })}
          />
          <input placeholder="Name"
            value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })}
          />
          <input placeholder="Color (optional)"
            value={newProd.color} onChange={e => setNewProd({ ...newProd, color: e.target.value })}
          />
          <textarea placeholder="Description (optional)"
            value={newProd.description} onChange={e => setNewProd({ ...newProd, description: e.target.value })}
          />
          <input placeholder="Initial stock" type="number"
            value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })}
          />
          <input placeholder="Image 1"
            value={newProd.image1} onChange={e => setNewProd({ ...newProd, image1: e.target.value })}
          />
          <input placeholder="Image 2"
            value={newProd.image2} onChange={e => setNewProd({ ...newProd, image2: e.target.value })}
          />
          <input placeholder="Image 3"
            value={newProd.image3} onChange={e => setNewProd({ ...newProd, image3: e.target.value })}
          />
          <button className="white-btn" type="submit">Add Product (price = –1)</button>
        </form>
      </div>

      {/* Stock Management Section */}
      <div className="section-box">
        <h2>Product Stock Management</h2>
        <ul className="product-stock-list">
          {products.map(p => (
            <li className="stock-item" key={p._id}>
              <div className="stock-left">
                <strong>{p.name}</strong> — ID: {p.product_id} (Stock: {p.stock})
              </div>
              <div className="stock-right">
                <input
                  type="number"
                  min="0"
                  value={stockEdits[p._id] ?? p.stock}
                  onChange={e => handleStockChange(p._id, e.target.value)}
                />
                <button onClick={() => updateStock(p._id)}>Update</button>
                <button className="delete-btn-box" onClick={() => removeProduct(p._id)}>🗑</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}