// src/api/purchase.js
export const checkoutCart = async (items) => {
  const token = localStorage.getItem("token");
  try {
      const response = await fetch("http://localhost:5001/purchase/checkout", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ items }),  // items should contain objects with { id, quantity, ... }
      });
      const data = await response.json();
      return data;
  } catch (error) {
      console.error("Error during checkout:", error);
      return { success: false, error: error.message };
  }
};
