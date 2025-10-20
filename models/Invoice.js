const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // or "User" if roles are in same model
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  serviceAmount: {
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
  description: {
    type: String,
    default: "Service invoice",
  },
  status: {
    type: String,
    enum: ["Unpaid", "Paid", "Cancelled"],
    default: "Unpaid",
  },
  dueDate: {
    type: Date,
  },
  issuedDate: {
    type: Date,
    default: Date.now,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
   razorpayOrderId: {type: String, default: null},
  razorpayPaymentId: {type: String, default: null},
  razorpayTransferId: {type: String, default: null},
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", InvoiceSchema);

module.exports = Invoice;
