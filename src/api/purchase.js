// src/api/purchase.js frontend UNUSED
export const recordPurchase = async (productId, quantity = 1, totalPrice) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("http://localhost:5001/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ productId, quantity, totalPrice }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error recording purchase:", error);
    return { success: false, error: error.message };
  }
};