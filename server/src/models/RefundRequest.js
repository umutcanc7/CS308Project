const mongoose = require("mongoose");

const RefundRequestSchema = new mongoose.Schema({
  purchaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Purchase", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  orderId: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  requestDate: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  approvalDate: { 
    type: Date 
  },
  reason: { 
    type: String 
  },
  adminNotes: { 
    type: String 
  }
});

module.exports = mongoose.model("RefundRequest", RefundRequestSchema); 