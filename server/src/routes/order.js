// order.js (Backend - Node.js)

const { MongoClient } = require("mongodb");

const uri = "your-mongo-db-uri";  // MongoDB URI'nizi buraya ekleyin
const client = new MongoClient(uri);

async function recordPurchase(orderDetails) {
  try {
    await client.connect();
    
    const database = client.db("your-database-name");
    const orders = database.collection("orders");

    const order = {
      orderId: generateOrderId(),  // Örnek: order ID oluşturma
      customerName: orderDetails.customerName,
      email: orderDetails.email,
      items: orderDetails.items,
      totalPrice: orderDetails.totalPrice,
      status: "paid",  // Siparişin ödeme durumu
      paymentDetails: {
        cardNumber: orderDetails.cardNumber,  // Gerçek ödeme yapılmaz
        cvv: orderDetails.cvv,
        expiryDate: orderDetails.expiryDate,
      },
      orderDate: new Date(),
    };

    const result = await orders.insertOne(order);
    return { success: true, orderId: result.insertedId };
  } finally {
    await client.close();
  }
}

// Sipariş ID'si oluşturma (örnek, benzersiz bir ID kullanabilirsiniz)
function generateOrderId() {
  return "ORD" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function getOrderDetails(orderId) {
  try {
    await client.connect();

    const database = client.db("your-database-name");
    const orders = database.collection("orders");

    const order = await orders.findOne({ orderId: orderId });
    return order;
  } finally {
    await client.close();
  }
}

module.exports = {
  recordPurchase,
  getOrderDetails,
};