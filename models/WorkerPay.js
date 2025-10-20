const mongoose = require("mongoose");

const WorkerPaySchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  razorpayPaymentId: { type: String, default: null},
  razorpayOrderId: { type: String, default: null},
  paymentMethod: {
    type: String,
    enum: ["BankTransfer", "UPI", "Cash"],
    default: "UPI",
  },
  paidDate: {
    type: Date,
  },
}, { timestamps: true });

const WorkerPay = mongoose.model("WorkerPay", WorkerPaySchema);

module.exports = WorkerPay;
