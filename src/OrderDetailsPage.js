// src/OrderDetailsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./OrderDetailsPage.css";

const getImage = (imageName) => {
  try {
    return require(`./assets/${imageName}`);
  } catch {
    return require("./assets/logo.png");
  }
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const { state }   = useLocation();
  const navigate    = useNavigate();

  const [items, setItems]       = useState(state?.items || []);
  const [dateStr, setDateStr]   = useState(state?.dateStr || "");
  const [grandTotal, setTotal]  = useState(state?.grandTotal || 0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5; // Keeping at 5 as confirmed

  /* fetch if state is missing */
  useEffect(() => {
    if (items.length) {
      // Calculate total pages based on items length
      setTotalPages(Math.ceil(items.length / itemsPerPage));
      return;
    }

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/home");

      try {
        const res  = await fetch("http://localhost:5001/purchase/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) return;

        const filtered = json.data.filter((p) => p.orderId === orderId);
        setItems(filtered);
        
        // Calculate total pages based on filtered items
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));

        const ts = Number(orderId.split("-")[1]);
        setDateStr(
          !Number.isNaN(ts)
            ? new Date(ts).toLocaleDateString("en-GB",
                { day:"2-digit", month:"long", year:"numeric" })
            : "Unknown date"
        );
        setTotal(
          filtered.reduce(
            (t, it) =>
              t +
              (Number(it.totalPrice) ||
                (Number(it.productId?.price) || 0) * (it.quantity || 1)),
            0
          )
        );
      } catch (e) {
        console.error("Error fetching order details:", e);
      }
    })();
  }, [items.length, orderId, navigate]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

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

  /* status breakdown */
  const statusSummary = items.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});
  const statusText = Object.entries(statusSummary)
    .map(([s, c]) => `${c} ${s.replace(/^\w/, (ch) => ch.toUpperCase())}`)
    .join(", ");

  return (
    <div className="order-details-page">
      {/* Back button removed as requested */}

      <h2>Order Details</h2>

      <section className="order-meta">
        <div><strong>Date:</strong> {dateStr}</div>
        <div><strong>Order&nbsp;ID:</strong> {orderId}</div>
        <div><strong>Total:</strong> {grandTotal.toFixed(2)} TL</div>
        {statusText && <div><strong>Status:</strong> {statusText}</div>}
      </section>

      <section className="order-items">
        {currentItems.map((it) => {
          const delivered = (it.status || "").toLowerCase() === "delivered";
          const src       = it.productId?.image1
            ? getImage(it.productId.image1)
            : it.productId?.imageUrl ||
              "https://via.placeholder.com/100x100?text=%20";
          const lineTotal =
            Number(it.totalPrice) ||
            (Number(it.productId?.price) || 0) * (it.quantity || 1);

          return (
            <div key={it._id} className="order-item-card">
              <img src={src} alt={it.productId?.name} />

              <div className="item-info">
                <h4>{it.productId?.name || "Unknown Product"}</h4>
                <p className="purchase-id">Purchase&nbsp;ID:&nbsp;{it._id}</p>
                <p>Quantity:&nbsp;{it.quantity}</p>
                <p>Total:&nbsp;{lineTotal.toFixed(2)}&nbsp;EUR</p>
                <p className="status">{it.status}</p>
              </div>

              <button
                className={`review-btn ${delivered ? "" : "disabled"}`}
                onClick={() =>
                  delivered && navigate(`/review/${it.productId?._id}`)
                }
              >
                Write&nbsp;Review
              </button>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="empty">No items found for this order.</p>
        )}
        
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
      </section>
    </div>
  );
}