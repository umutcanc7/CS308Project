import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./OrderDetailsPage.css";
import OrderDetailsPageAdmin from "./OrderDetailsPageAdmin";

const getImage = (imageName) => {
  try {
    return require(`./assets/${imageName}`);
  } catch {
    return require("./assets/logo.png");
  }
};

export default function OrderDetailsPageUser({ token }) {
  const { orderId } = useParams();
  const { state }   = useLocation();
  const navigate    = useNavigate();
  const [role, setRole] = useState(null);

  const [items, setItems]       = useState(state?.items || []);
  const [dateStr, setDateStr]   = useState(state?.dateStr || "");
  const [grandTotal, setTotal]  = useState(state?.grandTotal || 0);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("token");
    let tokenToUse = adminToken || userToken;
    if (!tokenToUse) {
      setRole("none");
      return;
    }
    fetch("http://localhost:5001/auth/is-admin", {
      headers: { Authorization: `Bearer ${tokenToUse}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRole(data.isAdmin ? "admin" : "user");
        else setRole("user");
      })
      .catch(() => setRole("user"));
  }, []);

  useEffect(() => {
    if (items.length) {
      setTotalPages(Math.ceil(items.length / itemsPerPage));
      return;
    }
    (async () => {
      if (!token) return navigate("/home");
      try {
        const res  = await fetch("http://localhost:5001/purchase/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) return;
        const filtered = json.data.filter((p) => p.orderId === orderId);
        setItems(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        const ts = Number(orderId.split("-")[1]);
        setDateStr(
          !Number.isNaN(ts)
            ? new Date(ts).toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" })
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
  }, [items.length, orderId, navigate, token]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const statusSummary = items.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});
  const statusText = Object.entries(statusSummary)
    .map(([s, c]) => `${c} ${s.replace(/^\w/, (ch) => ch.toUpperCase())}`)
    .join(", ");

  if (role === null) return <div>Loading...</div>;
  if (role === "admin") return <OrderDetailsPageAdmin />;
  if (role === "user") return (
    <div className="order-details-page">
      <h2>Order Details</h2>
      <section className="order-meta">
        <div><strong>Date:</strong> {dateStr}</div>
        <div><strong>Order&nbsp;ID:</strong> {orderId}</div>
        <div><strong>Total:</strong> {grandTotal.toFixed(2)} EUR</div>
        {statusText && <div><strong>Status:</strong> {statusText}</div>}
      </section>
      <section className="order-items">
        {currentItems.map((it) => {
          const delivered = (it.status || "").toLowerCase() === "delivered";
          console.log('Order item status:', it.status, 'Delivered:', delivered);
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
                onClick={() => {
                  if (delivered) navigate(`/review/${it.productId?._id}`);
                }}
              >
                Write&nbsp;Review
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="empty">No items found for this order.</p>
        )}
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
  return <div>You are not logged in.</div>;
} 