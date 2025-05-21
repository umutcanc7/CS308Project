// PurchasedProductsPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchasedProductsPage.css";

/* ─────────── same helper used in Shop.js ─────────── */
const getImage = (imageName) => {
  try {
    return require(`./assets/${imageName}`);
  } catch {
    return require("./assets/logo.png");
  }
};

export default function PurchasedProductsPage() {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ordersPerPage = 5;
  const navigate = useNavigate();

/* ───────────────────── FETCH & SHAPE DATA ───────────────────── */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res  = await fetch("http://localhost:5001/purchase/user", {
          headers: { Authorization: `Bearer ${token}` },
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

        /* enrich each group */
        const list = Object.entries(grouped).map(([orderId, items]) => {
          /* date string from epoch embedded in orderId */
          const ts       = Number(orderId.split("-")[1]);
          const dateStr  = !Number.isNaN(ts)
            ? new Date(ts).toLocaleDateString("en-GB",
                { day:"2-digit", month:"long", year:"numeric" })
            : "Unknown date";

          /* grand total */
          const grandTotal = items.reduce(
            (t, it) =>
              t +
              (Number(it.totalPrice) ||
                (Number(it.productId?.price) || 0) * (it.quantity || 1)),
            0
          );

          return { orderId, items, dateStr, grandTotal };
        });

        /* newest first */
        list.sort(
          (a, b) => Number(b.orderId.split("-")[1]) - Number(a.orderId.split("-")[1])
        );

        setOrders(list);
        setTotalPages(Math.ceil(list.length / ordersPerPage));
      } catch (err) {
        console.error("Error fetching purchases:", err);
      }
    })();
  }, []);

  // Get current page orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

/* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="purchased-page">
      <h2>Your Orders</h2>

      {orders.length === 0 ? (
        <p className="empty">You have not placed any orders yet.</p>
      ) : (
        <>
          {currentOrders.map(({ orderId, items, dateStr, grandTotal }) => {
            const thumbs      = items.slice(0, 7);
            const extraCount  = items.length - thumbs.length;

            /* status aggregation → e.g. 1 delivered, 2 processing */
            const statusCounts = items.reduce((acc, it) => {
              acc[it.status] = (acc[it.status] || 0) + 1;
              return acc;
            }, {});
            const statusSummary = Object.entries(statusCounts)
              .map(([s, c]) => `${c} ${s.replace(/^\w/, (ch) => ch.toUpperCase())}`)
              .join(", ");

            return (
              <div key={orderId} className="order-row">
                {/* left block: date, id, total, statuses */}
                <div className="order-info">
                  <div className="order-date">{dateStr}</div>
                  <div className="order-id">ID: {orderId}</div>
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
                {/* details arrow */}
                <button
                  className="details-btn"
                  onClick={() =>
                    navigate(`/order/${orderId}`, {
                      state: { orderId, items, dateStr, grandTotal },
                    })
                  }
                  aria-label="Details"
                >
                  &gt;
                </button>
              </div>
            );
          })}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                &lt;
              </button>
              
              <div className="pagination-numbers">
                {[...Array(totalPages).keys()].map(number => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`pagination-number ${currentPage === number + 1 ? 'active' : ''}`}
                  >
                    {number + 1}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}