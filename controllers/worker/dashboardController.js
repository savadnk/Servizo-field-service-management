const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Worker, Admin } = require("../../models/User");
const WorkerPay = require("../../models/WorkerPay");
const mongoose = require("mongoose");
const Notification = require("../../models/Notification");

const chooseCompanyPage = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).render("error", { error: "Access denied!" });
    }
    const workerId = req.user.id;
    const worker = await Worker.findById(workerId).select("admin").lean();
    // If already assigned to company → redirect to normal worker dashboard
    if (worker && worker.admin) {
      return res.redirect("/worker/dashboard");
    }

    // Fetch all admins (companies)
    const companies = await Admin.find({})
      .select("companyName servicesOffered email phone")
      .lean();

    res.render("worker/chooseCompany", {
      title: "Choose Company",
      user: req.user,
      companies
    });
  } catch (err) {
    console.error("chooseCompanyPage error:", err);
    res.status(500).render("error", { error: "Failed to load companies" });
  }
};

const joinCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (req.user.role !== "worker") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    // Update worker profile with chosen company
    await Worker.findByIdAndUpdate(req.user.id, { admin: companyId });

    await Notification.create({
      user: companyId,               // the admin who should see it
      message: `New worker ${req.user.name} registered successfully.`,
      type: "Worker",
      isRead: false,
    });

    res.redirect("/worker/dashboard?success=Joined company successfully");
  } catch (err) {
    console.error("joinCompany error:", err);
    res.status(500).render("error", { error: "Failed to join company" });
  }
};


const getWorkerDashboard = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const workerId = req.user.id;
    const worker = await Worker.findById(workerId);


    // 🔹 Ensure worker joined company
    const workerDoc = await Worker.findById(workerId).select("admin completedJobs rating revenue").lean();
    console.log(workerDoc)

    if (!workerDoc.admin) {
      return res.redirect("/worker/choose-company");
    
    }

    // 🔹 Active jobs
    const activeJobs = await JobAssignment.countDocuments({
      worker: workerId,
      status: { $in: ["Assigned", "Accepted", "In Progress"] }
    });

    // 🔹 New jobs
    const newJobs = await JobAssignment.countDocuments({
      worker: workerId,
      status: "Assigned"
    });

    // 🔹 Upcoming schedule
    const upcomingSchedule = await Job.find({
      _id: { $in: await JobAssignment.find({ worker: workerId }).distinct("job") },
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }).populate("customer", "name");

    // 📊 ====== CHART 1: PERFORMANCE TRACKER ======
    const performanceData = {
      completedJobs: workerDoc.completedJobs || 0,
      avgRating: workerDoc.rating || 0
    };

    // 📊 ====== CHART 2: EARNINGS TREND (LAST 6 MONTHS) ======
    const earnings = await WorkerPay.aggregate([
      {
        $match: {
          worker: new mongoose.Types.ObjectId(workerId),
          status: "Paid"
        }
      },
      {
        $group: {
          _id: { $month: "$paidDate" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.render("worker/dashboard", {
      title: "Worker Dashboard",
      user: req.user,
      active: "dashboard",
      isProfileComplete: res.locals.isProfileComplete,
      jobsCompleted: workerDoc.completedJobs || 0,
      avgRating: workerDoc.rating || 0,
      revenue: workerDoc.revenue || 0,
      newJobs,
      activeJobs,
      upcomingSchedule,
      performanceData,
      earnings,
      worker
    });
  } catch (error) {
    console.error("Worker Dashboard Error:", error);
    res.status(500).render("error", { error: "Server Error loading dashboard" });
  }
};
module.exports = { getWorkerDashboard, chooseCompanyPage, joinCompany };
