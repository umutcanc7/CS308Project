import { useEffect, useState } from "react";
import "./ProductManagerPage.css";

export default function ProductManagerPage() {
  const [cats, setCats] = useState([]);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState({ msg: "", error: false });
  const [products, setProducts] = useState([]);
  const [stockEdits, setStockEdits] = useState({});

  const adminToken = localStorage.getItem("adminToken");

  const load = async () => {
    const resCats = await fetch("http://localhost:5001/productmanager/categories");
    const jsonCats = await resCats.json();
    if (jsonCats.success) setCats(jsonCats.data);

    const resProducts = await fetch("http://localhost:5001/products");
    const jsonProducts = await resProducts.json();
    if (jsonProducts.success) setProducts(jsonProducts.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setStatus({ msg: `Category "${name}" is already added.`, error: true });
      return;
    }

    const res = await fetch("http://localhost:5001/productmanager/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();
    if (json.success) {
      setStatus({ msg: `"${name}" added ✔`, error: false });
      setNewName("");
      load();
    } else {
      setStatus({ msg: json.msg, error: true });
    }
  };

  const delCategory = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    const res = await fetch(`http://localhost:5001/productmanager/categories/${encodeURIComponent(name)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const json = await res.json();
    setStatus({ msg: json.msg, error: !json.success });
    if (json.success) load();
  };

  const handleStockChange = (id, value) => {
    setStockEdits((prev) => ({ ...prev, [id]: value }));
  };

  const updateStock = async (id) => {
    const newStock = Number(stockEdits[id]);
    if (isNaN(newStock) || newStock < 0) {
      setStatus({ msg: "Invalid stock value.", error: true });
      return;
    }

    const res = await fetch(`http://localhost:5001/productmanager/products/${id}/stock`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ stock: newStock }),
    });

    const json = await res.json();
    if (json.success) {
      setStatus({ msg: `Stock updated for product.`, error: false });
      setStockEdits((prev) => ({ ...prev, [id]: undefined }));
      load();
    } else {
      setStatus({ msg: json.msg || "Failed to update stock.", error: true });
    }
  };

  return (
    <div className="admin-page">
      <div className="sticky-header">
        <h1>Product Manager</h1>
        <form onSubmit={addCategory} className="add-form">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
          />
          <button type="submit">Add</button>
        </form>
        {status.msg && (
          <p className={status.error ? "status error" : "status ok"}>{status.msg}</p>
        )}
      </div>

      <h2>Existing Categories</h2>
      <div className="categories-list-container">
        <ul className="cat-list">
          {cats.map((c) => (
            <li key={c._id}>
              {c.name}
              <button onClick={() => delCategory(c.name)}>🗑</button>
            </li>
          ))}
          {cats.length === 0 && <li><em>No categories yet.</em></li>}
        </ul>
      </div>

      <h2>Product Stock Management</h2>
      <ul className="product-stock-list">
        {products.map((p) => (
          <li key={p._id}>
            <b>{p.name}</b> (Stock: {p.stock})
            <input
              type="number"
              min="0"
              value={stockEdits[p._id] !== undefined ? stockEdits[p._id] : p.stock}
              onChange={(e) => handleStockChange(p._id, e.target.value)}
              style={{ width: 60, marginLeft: 10 }}
            />
            <button onClick={() => updateStock(p._id)} style={{ marginLeft: 8 }}>
              Update Stock
            </button>
          </li>
        ))}
        {products.length === 0 && <li><em>No products found.</em></li>}
      </ul>
    </div>
  );
}
