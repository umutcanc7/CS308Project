import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchasedProductsPage.css";

function PurchasedProductsPage() {
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupedPurchases = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5001/purchase/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setUserId(data.userId);

          // Group by orderId
          const grouped = {};
          data.data.forEach((item) => {
            const orderId = item.orderId || "NO_ORDER_ID";
            if (!grouped[orderId]) grouped[orderId] = [];
            grouped[orderId].push(item);
          });

          const formattedOrders = Object.entries(grouped).map(([orderId, items]) => ({
            orderId,
            items,
          }));

          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error("Error fetching grouped purchases:", err);
      }
    };

    fetchGroupedPurchases();
  }, []);

  const goToReview = (productId) => {
    navigate(`/review/${productId}`);
  };

  return (
    <div className="purchased-page">
      <h2>Your Orders</h2>
      <p className="user-id">User ID: <code>{userId}</code></p>

      {orders.length === 0 ? (
        <p className="empty">You have not placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderId} className="order-block">
            <h3>Order ID: {order.orderId}</h3>
            <div className="purchased-items">
              {order.items.map((item) => (
                <div key={item._id} className="purchased-card">
                  <h4>{item.productId?.name || "Unknown Product"}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p>Total: ${item.totalPrice.toFixed(2)}</p>
                  <p>Status: <strong>{item.status}</strong></p>
                  <button
                    className="review-btn"
                    onClick={() => goToReview(item.productId?._id)}
                  >
                    Write a Review
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PurchasedProductsPage;
