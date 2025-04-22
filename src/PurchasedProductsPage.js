import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PurchasedProductsPage.css";

const images = require.context('./assets', false, /\.(png|jpe?g|webp|svg)$/);

function PurchasedProductsPage() {
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Load product image safely from filename
  const getImage = (imageName) => {
    if (!imageName) return images('./logo.png');
    try {
      return images(`./${imageName}`);
    } catch {
      return images('./logo.png');
    }
  };

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch("http://localhost:5001/purchase/user", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setProducts(data.data);

          // Fetch image names
          const newMap = {};
          for (const item of data.data) {
            const productId = item.productId?._id;
            if (productId) {
              try {
                const res = await fetch(`http://localhost:5001/products/${productId}`);
                const productData = await res.json();
                if (productData.success && productData.data?.image1) {
                  newMap[productId] = productData.data.image1;
                }
              } catch (err) {
                console.error("Failed to fetch product for image:", err);
              }
            }
          }
          setProductImages(newMap);
        } else {
          console.error("Fetch failed:", data.error);
        }
      } catch (err) {
        console.error("Error loading purchases:", err);
      }
    };

    fetchPurchases();
  }, [token]);

  const goToReview = (productId) => {
    navigate(`/review/${productId}`);
  };

  const updateStatus = async (purchaseId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5001/purchase/${purchaseId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Status updated!");
        setProducts((prev) =>
          prev.map((item) =>
            item._id === purchaseId ? { ...item, status: newStatus } : item
          )
        );
      } else {
        alert("❌ Failed to update status: " + data.error);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("❌ Error updating status.");
    }
  };

  return (
    <div className="purchased-page">
      <h2>Your Purchased Products</h2>
      {products.length === 0 ? (
        <p>You haven't purchased anything yet.</p>
      ) : (
        <div className="purchased-list">
          {products.map((item) => {
            const product = item.productId || {};
            const price = typeof item.totalPrice === "number" ? item.totalPrice.toFixed(2) : "N/A";
            const imageSrc = getImage(productImages[product._id]);

            return (
              <div key={item._id} className="purchased-card with-image">
                <img src={imageSrc} alt={product.name} className="purchased-img" />
                <div className="purchased-info">
                  <h3>{product.name || "Unknown Product"}</h3>
                  <p className="price">Price: ${price}</p>
                  <p>Status: <strong>{item.status}</strong></p>
                  <div className="purchased-buttons">
                    <button onClick={() => goToReview(product._id)}>Write a Review</button>
                    {item.status === "processing" && (
                      <button onClick={() => updateStatus(item._id, "in-transit")}>Mark as In-Transit</button>
                    )}
                    {item.status === "in-transit" && (
                      <button onClick={() => updateStatus(item._id, "delivered")}>Mark as Delivered</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PurchasedProductsPage;
