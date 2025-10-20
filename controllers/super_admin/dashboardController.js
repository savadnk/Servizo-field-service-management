const mongoose = require("mongoose");
const { User, Admin, Worker, Customer } = require("../../models/User");
const Job = require("../../models/Job");
const Invoice = require("../../models/Invoice");
const Payment = require("../../models/Payment");

const getDashboard = async (req, res) => {
  try {
    // ===== BASIC COUNTS =====
    const totalAdmins = await Admin.countDocuments();
    const totalWorkers = await Worker.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalJobs = await Job.countDocuments();

    // ===== JOB STATUS BREAKDOWN =====
    const jobsByStatusArray = await Job.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const jobsByStatus = {};
    jobsByStatusArray.forEach((item) => {
      jobsByStatus[item._id] = item.count;
    });

    // ===== TOTAL REVENUE =====
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // ===== MONTHLY REVENUE TREND =====
    const revenueTrend = await Payment.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: { month: { $month: "$paidAt" }, year: { $year: "$paidAt" } },
          total: { $sum: "$amountPaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ===== USER GROWTH =====
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            role: "$role",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ===== TOP 5 AGENCIES BY REVENUE =====
    const topAgencies = await Payment.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: "$admin",
          totalRevenue: { $sum: "$amountPaid" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$admin.companyName",
          totalRevenue: 1,
        },
      },
    ]);

    // ===== TOP 5 WORKERS BY EARNINGS =====
    const topWorkers = await Worker.find({})
      .sort({ revenue: -1 })
      .limit(5)
      .select("name revenue")
      .lean();

    res.render("superadmin/dashboard", {
      user: req.user,
      title: "SuperAdmin Dashboard",
      active: "dashboard",
      stats: {
        totalAdmins,
        totalWorkers,
        totalCustomers,
        totalJobs,
        jobsByStatus,
        totalRevenue,
      },
      revenueTrend,
      userGrowth,
      topAgencies,
      topWorkers,
    });
  } catch (error) {
    console.error("Super Admin Dashboard Error:", error);
    res.status(500).render("error", { error: "Failed to load dashboard" });
  }
};

module.exports = getDashboard;
