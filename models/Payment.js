const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Razorpay", "Stripe", "Cash", "Other"],
    default: "Razorpay",
  },
  transactionId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  paidAt: {
    type: Date,
  },
}, { timestamps: true });

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
