// src/SalesManagerInvoices.js
import React, { useEffect, useState } from "react";
import { useNavigate }               from "react-router-dom";
import "./SalesManagerInvoices.css";          /* ➜ add your own styles */

/* ─────────── same helper used in Shop.js ─────────── */
const getImage = (imageName) => {
  try {
    return require(`./assets/${imageName}`);
  } catch {
    return require("./assets/logo.png");
  }
};

const API_BASE =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "");

export default function SalesManagerInvoices() {
  const [orders,      setOrders]      = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const navigate       = useNavigate();
  const ordersPerPage  = 6;               // tweak as you like

/* ───────────────────── FETCH & SHAPE DATA ───────────────────── */
  useEffect(() => {
    (async () => {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) return;

      try {
        const res  = await fetch(`${API_BASE}/purchase/all`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) return;

        /* group by orderId */
        const grouped = {};
        json.data.forEach((p) => {
          const key = p.orderId || "NO_ORDER_ID";
          grouped[key] ??= [];
          grouped[key].push(p);
        });

        const list = Object.entries(grouped).map(([orderId, items]) => {
          const ts        = Number(orderId.split("-")[1]);
          const dateStr   = !Number.isNaN(ts)
            ? new Date(ts).toLocaleDateString("en-GB",
                { day:"2-digit", month:"long", year:"numeric" })
            : "Unknown date";

          const grandTotal = items.reduce(
            (t, it) => t + (Number(it.totalPrice) ||
              (Number(it.productId?.price) || 0) * (it.quantity || 1)),
            0
          );

          /* take buyer info from the first item (all share userId) */
          const buyer = items[0].userId;
          const buyerLabel = buyer?.username || buyer?.email || buyer?._id || "Unknown user";

          return { orderId, items, dateStr, grandTotal, buyerLabel };
        });

        list.sort((a, b) => Number(b.orderId.split("-")[1]) - Number(a.orderId.split("-")[1]));

        setOrders(list);
        setTotalPages(Math.ceil(list.length / ordersPerPage));
      } catch (err) {
        console.error("Error fetching all purchases:", err);
      }
    })();
  }, []);

  /* pagination helpers */
  const currLast  = currentPage * ordersPerPage;
  const currFirst = currLast - ordersPerPage;
  const currOrders= orders.slice(currFirst, currLast);

  const prevPage  = () => currentPage > 1           && setCurrentPage(currentPage - 1);
  const nextPage  = () => currentPage < totalPages  && setCurrentPage(currentPage + 1);
  const goPage    = (n)  => setCurrentPage(n);

/* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="sales-invoices-page">
      <h2>All Orders (Sales-Manager View)</h2>

      {orders.length === 0 ? (
        <p className="empty">No orders in the system.</p>
      ) : (
        <>
          {currOrders.map(({ orderId, items, dateStr, grandTotal, buyerLabel }) => {
            const thumbs      = items.slice(0, 7);
            const extraCount  = items.length - thumbs.length;

            const statusCounts = items.reduce((acc, it) => {
              acc[it.status] = (acc[it.status] || 0) + 1;
              return acc;
            }, {});
            const statusSummary = Object.entries(statusCounts)
              .map(([s, c]) => `${c} ${s.replace(/^\w/, ch => ch.toUpperCase())}`)
              .join(", ");

            return (
              <div key={orderId} className="order-row">
                {/* left column */}
                <div className="order-info">
                  <div className="order-date">{dateStr}</div>
                  <div className="order-id">ID: {orderId}</div>
                  <div className="order-buyer">Buyer: {buyerLabel}</div>
                  <div className="order-total">
                    <strong>{grandTotal.toFixed(2)}&nbsp;EUR</strong>
                  </div>
                  <div className="order-status">{statusSummary}</div>
                </div>

                {/* thumbnails */}
                <div className="thumb-list">
                  {thumbs.map((it) => {
                    const src = it.productId?.image1
                      ? getImage(it.productId.image1)
                      : it.productId?.imageUrl ||
                        "https://via.placeholder.com/60x60?text=%20";
                    return (
                      <img
                        key={it._id}
                        src={src}
                        alt={it.productId?.name || "Product"}
                      />
                    );
                  })}
                  {extraCount > 0 && (
                    <span className="more-count">+{extraCount}&nbsp;more</span>
                  )}
                </div>

                {/* details ► */}
                <button
                  className="details-btn"
                  onClick={() => navigate(`/admin-order/${orderId}`)}
                  aria-label="Details"
                >
                  &gt;
                </button>
              </div>
            );
          })}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>&lt;</button>
              {[...Array(totalPages).keys()].map(i => (
                <button
                  key={i+1}
                  onClick={() => goPage(i+1)}
                  className={currentPage === i+1 ? "active" : undefined}
                >
                  {i+1}
                </button>
              ))}
              <button onClick={nextPage} disabled={currentPage === totalPages}>&gt;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}