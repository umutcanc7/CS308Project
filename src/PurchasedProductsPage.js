// src/PurchasedProductsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchasedProductsPage.css";

function PurchasedProductsPage() {
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:5001/purchase/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) return;

        setUserId(data.userId);

        // ---------- group by orderId ----------
        const grouped = {};
        data.data.forEach((p) => {
          const key = p.orderId || "NO_ORDER_ID";
          grouped[key] ??= [];
          grouped[key].push(p);
        });

        // ---------- convert to array ----------
        const formattedOrders = Object.entries(grouped).map(
          ([orderId, items]) => ({
            orderId,
            items,
            // NEW: compute order-level total on the fly
            orderTotal: items.reduce(
              (sum, it) =>
                sum +
                (Number(it.totalPrice) || // existing value
                  (Number(it.productId?.price) || 0) * (it.quantity || 1)),
              0
            ),
          })
        );

        setOrders(formattedOrders);
      } catch (err) {
        console.error("Error fetching grouped purchases:", err);
      }
    })();
  }, []);

  const goToReview = (productId) => navigate(`/review/${productId}`);

  return (
    <div className="purchased-page">
      <h2>Your Orders</h2>
      <p className="user-id">
        User ID: <code>{userId}</code>
      </p>

      {orders.length === 0 ? (
        <p className="empty">You have not placed any orders yet.</p>
      ) : (
        orders.map(({ orderId, items, orderTotal }) => (
          <div key={orderId} className="order-block">
            <h3>Order ID: {orderId}</h3>
            <p className="order-total">
              {/* NEW: order-level total */}
              Order total:&nbsp;
              <strong>{orderTotal.toFixed(2)} TL</strong>
            </p>
            <div className="purchased-items">
              {items.map((it) => {
                // NEW: safe per-item total
                const lineTotal =
                  Number(it.totalPrice) ||
                  (Number(it.productId?.price) || 0) * (it.quantity || 1);

                return (
                  <div key={it._id} className="purchased-card">
                    <h4>{it.productId?.name || "Unknown Product"}</h4>
                    <p>Quantity: {it.quantity}</p>
                    <p>Total: {lineTotal.toFixed(2)} TL</p>
                    <p>
                      Status:&nbsp;<strong>{it.status}</strong>
                    </p>
                    <button
                      className="review-btn"
                      onClick={() => goToReview(it.productId?._id)}
                    >
                      Write a Review
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PurchasedProductsPage;