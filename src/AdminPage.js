import { useNavigate } from "react-router-dom";
import "./AdminPage.css";

export default function AdminPage() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");

  // Redirect to home if no admin token
  if (!adminToken) {
    navigate("/home");
    return null;
  }

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Admin Dashboard</h1>
      
      <div className="role-selection">
        <div className="role-card" onClick={() => navigate("/product-manager-page")}>
          <h2>Product Manager</h2>
          <p>Manage product categories, add new products, and update stock levels</p>
        </div>
        
        <div className="role-card" onClick={() => navigate("/sales-manager-page")}>
          <h2>Sales Manager</h2>
          <p>Set prices for new products added by the product manager</p>
        </div>
      </div>
    </div>
  );
} 