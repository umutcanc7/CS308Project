// This file is a direct copy of the current OrderDetailsPage.js (admin logic)
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./OrderDetailsPage.css";
import { fetchReviews } from "./api/reviews";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

const DELIVERY_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "in-transit", label: "In-Transit" },
  { value: "delivered", label: "Delivered" },
];

const getImage = (imageName) => {
  try {
    return require(`./assets/${imageName}`);
  } catch {
    return require("./assets/logo.png");
  }
};

export default function OrderDetailsPageAdmin({ token }) {
  const { orderId } = useParams();
  const { state }   = useLocation();
  const navigate    = useNavigate();

  const [items, setItems]       = useState(state?.items || []);
  const [dateStr, setDateStr]   = useState(state?.dateStr || "");
  const [grandTotal, setTotal]  = useState(state?.grandTotal || 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const [statusEdits, setStatusEdits] = useState({});
  const [saving, setSaving] = useState({});
  const [saveMsg, setSaveMsg] = useState({});
  const [productReviews, setProductReviews] = useState({});
  const [reviewSaving, setReviewSaving] = useState({});
  const [reviewMsg, setReviewMsg] = useState({});
  const isAdmin = true;

  useEffect(() => {
    if (items.length) {
      setTotalPages(Math.ceil(items.length / itemsPerPage));
      return;
    }
    (async () => {
      if (!token) return navigate("/home");
      try {
        const res  = await fetch("http://localhost:5001/purchase/all", {
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

  // Fetch reviews for all products in the order (admin only)
  useEffect(() => {
    if (!isAdmin || !items.length) return;
    const userId = items[0]?.userId?._id || items[0]?.userId || items[0]?.user?._id;
    const fetchAll = async () => {
      const reviewsByProduct = {};
      for (const it of items) {
        const res = await fetchReviews(it.productId?._id || it.productId, token);
        if (res.success) {
          reviewsByProduct[it.productId?._id || it.productId] = res.data;
        }
      }
      setProductReviews(reviewsByProduct);
    };
    fetchAll();
    // eslint-disable-next-line
  }, [isAdmin, items, token]);

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

  return (
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
          const src = it.productId?.image1
            ? getImage(it.productId.image1)
            : it.productId?.imageUrl ||
              "https://via.placeholder.com/100x100?text=%20";
          const lineTotal =
            Number(it.totalPrice) ||
            (Number(it.productId?.price) || 0) * (it.quantity || 1);
          // Find review by purchasing user (if any)
          let reviewBlock = null;
          if (isAdmin) {
            const reviews = productReviews[it.productId?._id || it.productId] || [];
            const pendingReviews = reviews.filter(r => r.status === "pending");
            if (pendingReviews.length > 0) {
              reviewBlock = (
                <div style={{ marginTop: 12, background: '#f8f8f8', padding: 8, borderRadius: 6 }}>
                  <div><strong>Pending Reviews:</strong></div>
                  {pendingReviews.map(review => (
                    <div key={review._id} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 6 }}>
                      <div>Rating: {review.rating} / 5</div>
                      <div>Comment: {review.comment || <em>No comment</em>}</div>
                      <div style={{ marginTop: 4 }}>
                        <label>
                          <strong>Status:&nbsp;</strong>
                          <select
                            value={review.status}
                            disabled={reviewSaving[review._id]}
                            onChange={async e => {
                              const newStatus = e.target.value;
                              setReviewSaving(s => ({ ...s, [review._id]: true }));
                              setReviewMsg(m => ({ ...m, [review._id]: "" }));
                              try {
                                const res = await fetch(`http://localhost:5001/reviews/${review._id}/${newStatus === "approved" ? "approve" : "decline"}`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                });
                                const json = await res.json();
                                if (res.ok && json.success) {
                                  setProductReviews(pr => {
                                    const arr = pr[it.productId?._id || it.productId] || [];
                                    return {
                                      ...pr,
                                      [it.productId?._id || it.productId]: arr.map(r => r._id === review._id ? { ...r, status: newStatus } : r)
                                    };
                                  });
                                  setReviewMsg(m => ({ ...m, [review._id]: "Updated!" }));
                                } else {
                                  setReviewMsg(m => ({ ...m, [review._id]: json.error || "Failed" }));
                                }
                              } catch (e) {
                                setReviewMsg(m => ({ ...m, [review._id]: "Error" }));
                              }
                              setReviewSaving(s => ({ ...s, [review._id]: false }));
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="declined">Decline</option>
                          </select>
                          {reviewMsg[review._id] && <span style={{ marginLeft: 8, color: reviewMsg[review._id] === "Updated!" ? "green" : "red" }}>{reviewMsg[review._id]}</span>}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              );
            } else {
              reviewBlock = <div style={{ marginTop: 12, color: '#888' }}><em>No pending reviews for this product.</em></div>;
            }
          }
          return (
            <div key={it._id} className="order-item-card">
              <img src={src} alt={it.productId?.name} />
              <div className="item-info">
                <h4>{it.productId?.name || "Unknown Product"}</h4>
                <p className="purchase-id">Purchase&nbsp;ID:&nbsp;{it._id}</p>
                <p>Quantity:&nbsp;{it.quantity}</p>
                <p>Total:&nbsp;{lineTotal.toFixed(2)}&nbsp;EUR</p>
                <div style={{ marginTop: 8 }}>
                  <label>
                    <strong>Change Delivery Status:&nbsp;</strong>
                    <select
                      value={statusEdits[it._id] ?? it.status}
                      onChange={e => setStatusEdits(s => ({ ...s, [it._id]: e.target.value }))}
                      disabled={saving[it._id]}
                    >
                      {DELIVERY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    style={{ marginLeft: 8 }}
                    disabled={saving[it._id] || (statusEdits[it._id] ?? it.status) === it.status}
                    onClick={async () => {
                      setSaving(s => ({ ...s, [it._id]: true }));
                      setSaveMsg(m => ({ ...m, [it._id]: "" }));
                      try {
                        const res = await fetch(`http://localhost:5001/purchase/${it._id}/status`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: statusEdits[it._id] ?? it.status }),
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          setItems(items => items.map(p => p._id === it._id ? { ...p, status: statusEdits[it._id] ?? it.status } : p));
                          setSaveMsg(m => ({ ...m, [it._id]: "Updated!" }));
                        } else {
                          setSaveMsg(m => ({ ...m, [it._id]: json.error || "Failed" }));
                        }
                      } catch (e) {
                        setSaveMsg(m => ({ ...m, [it._id]: "Error" }));
                      }
                      setSaving(s => ({ ...s, [it._id]: false }));
                    }}
                  >
                    Save
                  </button>
                  {saveMsg[it._id] && <span style={{ marginLeft: 8, color: saveMsg[it._id] === "Updated!" ? "green" : "red" }}>{saveMsg[it._id]}</span>}
                </div>
                {reviewBlock}
              </div>
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
} 