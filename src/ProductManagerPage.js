import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";          // ← NEW
import "./ProductManagerPage.css";

export default function ProductManagerPage() {
  /* ------------ state ------------ */
  const [cats, setCats]         = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus]     = useState({ msg:"", error:false });

  const [newCat, setNewCat]     = useState("");
  const [stockEdits, setStockEdits] = useState({});

  /* ------------ add-product form state ------------ */
  const [newProd, setNewProd] = useState({
    product_id:"",          // manual numeric ID
    name:"", category:"", color:"",
    description:"", stock:10,
    image1:"", image2:"", image3:""
  });

  const adminToken = localStorage.getItem("adminToken");
  const navigate   = useNavigate();                      // ← NEW

  /* ------------ load cats & products ------------ */
  const load = async () => {
    const c = await fetch("http://localhost:5001/productmanager/categories").then(r=>r.json());
    if (c.success) setCats(c.data);

    const p = await fetch("http://localhost:5001/productmanager/products").then(r=>r.json());
    if (p.success) setProducts(p.data);
  };
  useEffect(()=>{ load(); }, []);

  /* ------------ category helpers ------------ */
  const addCategory = async e => {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    if (cats.some(c=>c.name.toLowerCase() === name.toLowerCase())) {
      setStatus({ msg:`Category "${name}" is already added.`, error:true }); return;
    }
    const out = await fetch("http://localhost:5001/productmanager/categories",{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${adminToken}` },
      body:JSON.stringify({ name })
    }).then(r=>r.json());

    setStatus({ msg:out.msg || `"${name}" added ✔`, error:!out.success });
    if (out.success) { setNewCat(""); load(); }
  };

  const delCategory = async name => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const out = await fetch(`http://localhost:5001/productmanager/categories/${encodeURIComponent(name)}`,{
      method:"DELETE",
      headers:{ Authorization:`Bearer ${adminToken}` }
    }).then(r=>r.json());

    setStatus({ msg:out.msg, error:!out.success });
    if (out.success) load();
  };


  /* ------------ remove product helper ------------ */
  const removeProduct = async id => {
    if (!window.confirm("Remove this product?")) return;
    const out = await fetch(`http://localhost:5001/productmanager/products/${id}`,{
      method:"DELETE",
      headers:{ Authorization:`Bearer ${adminToken}` }
    }).then(r=>r.json());

    setStatus({ msg:out.msg, error:!out.success });
    if (out.success) load();
  };


  /* ------------ stock helpers ------------ */
  const handleStockChange = (id,val)=> setStockEdits(p=>({...p,[id]:val}));
  const updateStock = async id => {
    const s = Number(stockEdits[id]);
    if (isNaN(s) || s < 0) { setStatus({ msg:"Invalid stock value.", error:true }); return; }

    const out = await fetch(`http://localhost:5001/productmanager/products/${id}/stock`,{
      method:"PUT",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${adminToken}` },
      body:JSON.stringify({ stock:s })
    }).then(r=>r.json());

    setStatus({ msg:out.msg || "Failed to update stock.", error:!out.success });
    if (out.success) { setStockEdits(p=>({...p,[id]:undefined})); load(); }
  };

  /* ------------ add product ------------ */
  const addProduct = async e => {
    e.preventDefault();
    const { product_id, name, category, image1, image2, image3 } = newProd;
    if (!product_id || !name.trim() || !category || !image1 || !image2 || !image3) {
      setStatus({ msg:"product_id, name, category and three image fields are required.", error:true });
      return;
    }

    const payload = { ...newProd, product_id: Number(product_id) };

    const out = await fetch("http://localhost:5001/productmanager/products",{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${adminToken}` },
      body:JSON.stringify(payload)
    }).then(r=>r.json());

    setStatus({ msg:out.msg || "Product added.", error:!out.success });
    if (out.success) {
      setNewProd({
        product_id:"", name:"", category:"", color:"",
        description:"", stock:10,
        image1:"", image2:"", image3:""
      });
      load();
    }
  };

  /* ------------ render ------------ */
  return (
    <div className="admin-page">
      <div className="sticky-header">
        {/* header row with new button */}
        <div style={{display:"flex", alignItems:"center", gap:"1rem"}}>
          <h1 style={{margin:0}}>Product Manager</h1>
          {/* ← NEW BUTTON */}
          <button
            onClick={()=>navigate("/product-manager-purchases")}
            className="pm-purchases-btn"
          >
            Purchases
          </button>
        </div>

        {/* ---- Add Category ---- */}
        <form onSubmit={addCategory} className="add-form">
          <input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="New category name"/>
          <button type="submit">Add</button>
        </form>

        {status.msg && <p className={status.error?"status error":"status ok"}>{status.msg}</p>}
      </div>

      {/* ---- Categories ---- */}
      <h2>Existing Categories</h2>
      <ul className="cat-list">
        {cats.map(c=>(
          <li key={c._id}>
            {c.name}
            <button onClick={()=>delCategory(c.name)}>🗑</button>
          </li>
        ))}
        {cats.length===0 && <li><em>No categories yet.</em></li>}
      </ul>

      {/* ---- Add product ---- */}
      <h2>Add New Product</h2>
      <form onSubmit={addProduct} className="add-product-form">
        {/* product_id input */}
        <input
          type="number"
          placeholder="Product ID"
          value={newProd.product_id}
          onChange={e=>setNewProd({...newProd, product_id:e.target.value})}
        />
        <input
          placeholder="Name"
          value={newProd.name}
          onChange={e=>setNewProd({...newProd, name:e.target.value})}
        />
        <select
          value={newProd.category}
          onChange={e=>setNewProd({...newProd, category:e.target.value})}
        >
          <option value="">Select category</option>
          {cats.map(c=><option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <input
          placeholder="Color (optional)"
          value={newProd.color}
          onChange={e=>setNewProd({...newProd, color:e.target.value})}
        />
        <textarea
          placeholder="Description (optional)"
          value={newProd.description}
          onChange={e=>setNewProd({...newProd, description:e.target.value})}
        />
        <input
          type="number"
          min="0"
          placeholder="Initial stock"
          value={newProd.stock}
          onChange={e=>setNewProd({...newProd, stock:e.target.value})}
        />
        {/* three image fields */}
        <input
          placeholder="Image 1 (e.g. red1.jpg)"
          value={newProd.image1}
          onChange={e=>setNewProd({...newProd, image1:e.target.value})}
        />
        <input
          placeholder="Image 2"
          value={newProd.image2}
          onChange={e=>setNewProd({...newProd, image2:e.target.value})}
        />
        <input
          placeholder="Image 3"
          value={newProd.image3}
          onChange={e=>setNewProd({...newProd, image3:e.target.value})}
        />
        <button type="submit">Add Product (price = –1)</button>
      </form>

      {/* ---- Stock management ---- */}
      <h2>Product Stock Management</h2>
      <ul className="product-stock-list">
        {products.map(p=>(
          <li key={p._id}>
            <b>{p.name}</b> — ID: {p.product_id} (Stock: {p.stock})
            <input
              type="number" min="0"
              value={stockEdits[p._id]!==undefined ? stockEdits[p._id] : p.stock}
              onChange={e=>handleStockChange(p._id, e.target.value)}
              style={{ width:60, marginLeft:10 }}
            />
            <button onClick={()=>updateStock(p._id)} style={{ marginLeft:8 }}>
              Update Stock
            </button>
            <button onClick={()=>removeProduct(p._id)} style={{ marginLeft:8 }}>
              🗑 Remove
            </button>
          </li>
        ))}
        {products.length===0 && <li><em>No products found.</em></li>}
      </ul>
    </div>
  );
}