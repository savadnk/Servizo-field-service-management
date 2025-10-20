const mongoose = require("mongoose");
const Job = require("../../models/Job");
const Invoice = require("../../models/Invoice");
const Payment = require("../../models/Payment");
const { Customer } = require("../../models/User");



const getDashboard = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = await Customer.findById(customerId);


    // 🔹 Summary Stats
    const totalRequests = await Job.countDocuments({ customer: customerId });
    const completedJobs = await Job.countDocuments({ customer: customerId, status: "Completed" });
    const activeJobs = await Job.countDocuments({
      customer: customerId,
      status: { $in: ["Assigned", "Paused", "Accepted"] },
    });

    // 🔹 Pending Payments (real logic)
    const pendingPaymentsData = await Invoice.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          status: "Unpaid",
        },
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$totalAmount" },
        },
      },
    ]);
    const pendingPayments =
      pendingPaymentsData.length > 0 ? pendingPaymentsData[0].totalPending : 0;

    // 📊 ===== Chart 1: JOB SUMMARY (Pie) =====
    const jobSummary = await Job.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 📊 ===== Chart 2: SPENDING TREND (Line - Real Logic) =====
    // Based on Payments with status "Paid"
    const spendingTrend = await Payment.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
          status: "Paid",
        },
      },
      {
        $group: {
          _id: { month: { $month: "$paidAt" }, year: { $year: "$paidAt" } },
          total: { $sum: "$amountPaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.render("customer/dashboard", {
      title: "Customer Dashboard",
      user: req.user,
      active: "dashboard",
      isProfileComplete: res.locals.isProfileComplete,
      totalRequests,
      completedJobs,
      activeJobs,
      pendingPayments,
      jobSummary,
      spendingTrend,
      customer,
    });
  } catch (err) {
    console.error("Customer Dashboard Error:", err);
    res.status(500).render("error", { error: "Dashboard load failed" });
  }
};

module.exports = { getDashboard };
