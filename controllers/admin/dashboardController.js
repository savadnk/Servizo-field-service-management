const Job = require("../../models/Job");
const { Worker, Customer , Admin } = require("../../models/User");
const Invoice = require("../../models/Invoice");
const Feedback = require("../../models/Feedback");
const JobAssignment = require("../../models/JobAssignment");
const mongoose = require("mongoose");
const Notification = require("../../models/Notification");




// Helper: group by week
const getWeekKey = (date) => {
  const d = new Date(date);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
};

const getAdminDashboard = async (req, res) => {
  try {
    
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const adminId = req.user.id;
    const admin = await Admin.findById(adminId);
    if (!admin.verified) {
      return res.redirect("/admin/pending");
    }
      
  

     const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    // ✅ Total Requests for this Admin
    const totalRequests = await Job.countDocuments({ admin: adminId });

    // ✅ Completed Jobs
    const completedJobs = await Job.countDocuments({ admin: adminId, status: "Completed" });

    // ✅ Pending Jobs
    const pendingJobs = await Job.countDocuments({
      admin: adminId,
      status: { $in: ["Pending", "Assigned", "Paused"] },
    });

    // ✅ Active Workers (status Active under this admin)
    const activeWorkers = await Worker.countDocuments({ admin: adminId});

    

    // ✅ Revenue (sum of invoices for this admin)
    const revenueResult = await Invoice.aggregate([
      { $match: { admin: new mongoose.Types.ObjectId(adminId) , status: "Paid"} },
      { $group: { _id: null, totalRevenue: { $sum: { $multiply: ["$serviceAmount", 0.3] } } } },
    ]);
    const revenue = revenueResult[0]?.totalRevenue || 0;
    console.log(revenueResult);


     // ========== 🟦 1. JOBS PER WEEK (for this admin only) ==========
    const jobs = await Job.find({ admin: adminId }).select("createdAt status");
    const jobsPerWeek = {};
    jobs.forEach(job => {
      const week = getWeekKey(job.createdAt);
      jobsPerWeek[week] = (jobsPerWeek[week] || 0) + 1;
    });

    // ========== 🟩 2. WORKER PERFORMANCE (under this admin) ==========
    // Find workers under this admin
    const adminWorkers = await Worker.find({ admin: adminId }).select("_id name profilePhoto");

    // Collect worker IDs
    const workerIds = adminWorkers.map(w => w._id);

    // Get feedback for these workers only
    const workerFeedback = await Feedback.aggregate([
      { $match: { worker: { $in: workerIds } } },
      {
        $group: {
          _id: "$worker",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: 5 }
    ]);

    const workerPerformance = workerFeedback.map(fb => {
      const worker = adminWorkers.find(w => w._id.equals(fb._id));
      return {
        name: worker ? worker.name : "Unknown",
        avgRating: fb.avgRating.toFixed(1),
        totalReviews: fb.totalReviews
      };
    });

    // 🟧 REVENUE TREND (Monthly)
const revenueTrend = await Invoice.aggregate([
  { $match: { admin: new mongoose.Types.ObjectId(adminId), status: "Paid" } },
  {
    $group: {
      _id: { $month: "$createdAt" },
      totalRevenue: { $sum: { $multiply: ["$serviceAmount", 0.3] } } // ✅ Admin's 30% share
    }
  },
  { $sort: { "_id": 1 } }
]);



    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      user: req.user,
      stats: {
        totalRequests,
        completedJobs,
        pendingJobs,
        activeWorkers,
        revenue,
      },
      jobsPerWeek,
      workerPerformance,
      revenueTrend,
     unreadCount,
     admin,
      isProfileComplete: res.locals.isProfileComplete,
      active: "dashboard",

    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).render("error", { error: "Failed to load dashboard" });
  }
  
};

module.exports = { getAdminDashboard };
