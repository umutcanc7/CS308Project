// ProductManagerPage.js
import { useEffect, useState } from "react";

export default function ProductManagerPage() {
  const [cats, setCats]       = useState([]);
  const [newName, setNewName] = useState("");
  const [status, setStatus]   = useState({ msg:"", error:false });

  const adminToken = localStorage.getItem("adminToken");   // set in AuthModal

  /* Fetch categories on mount & after mutations */
  const load = async () => {
    const res  = await fetch("http://localhost:5001/productmanager/categories");
    const json = await res.json();
    if (json.success) setCats(json.data);
  };

  useEffect(()=>{ load(); }, []);

  /* ------------ Add category ------------ */
  const addCategory = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setStatus({ msg: `Category "${name}" is already added.`, error: true });
      return;
    }

    const res  = await fetch("http://localhost:5001/productmanager/categories", {
      method:"POST",
      headers:{ "Content-Type":"application/json",
                Authorization:`Bearer ${adminToken}` },
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (json.success){
      setStatus({ msg:`"${name}" added ✔`, error:false });
      setNewName("");
      load();
    } else {
      setStatus({ msg:json.msg, error:true });
    }
  };

  /* ------------ Delete category ------------ */
  const delCategory = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const res  = await fetch(`http://localhost:5001/productmanager/categories/${encodeURIComponent(name)}`, {
      method:"DELETE",
      headers:{ Authorization:`Bearer ${adminToken}` }
    });
    const json = await res.json();
    setStatus({ msg:json.msg, error:!json.success });
    if (json.success) load();
  };

  return (
    <div className="admin-page">
      <div className="sticky-header">
        <h1>Product Manager</h1>

        <form onSubmit={addCategory} className="add-form">
          <input
            value={newName}
            onChange={e=>setNewName(e.target.value)}
            placeholder="New category name"
          />
          <button type="submit">Add</button>
        </form>

        {status.msg && (
          <p className={status.error ? "status error":"status ok"}>{status.msg}</p>
        )}
      </div>

      <h2>Existing categories</h2>
      <div className="categories-list-container">
        <ul className="cat-list">
          {cats.map(c=>(
            <li key={c._id}>
              {c.name}
              <button onClick={()=>delCategory(c.name)}>🗑</button>
            </li>
          ))}
          {cats.length===0 && <li><em>none yet</em></li>}
        </ul>
      </div>
    </div>
  );
}