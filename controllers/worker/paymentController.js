const WorkerPay = require("../../models/WorkerPay");
const moment = require("moment");
const { Worker } = require("../../models/User");


// ✅ Worker Earnings & Payments Dashboard
const getEarningsDashboard = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker =  await Worker.findById(workerId)
    // All payments for the logged-in worker
    const payments = await WorkerPay.find({ worker: workerId })
 
      .populate("admin", "companyName")
      .populate({
        path:"job",
                populate: { path: "customer", select: "name" },

      })
      .sort({ createdAt: -1 })
      .lean();
      console.log(payments)
      

    // ✅ Calculate earnings this week
    const startOfWeek = moment().startOf("week");
    const weekEarnings = payments
      .filter(p => p.status === "Paid" && moment(p.paidDate).isAfter(startOfWeek))
      .reduce((sum, p) => sum + p.amount, 0);

    // ✅ Calculate earnings this month
    const startOfMonth = moment().startOf("month");
    const monthEarnings = payments
      .filter(p => p.status === "Paid" && moment(p.paidDate).isAfter(startOfMonth))
      .reduce((sum, p) => sum + p.amount, 0);

    res.render("worker/earnings", {
      title: "Earnings & Payments",
      weekEarnings,
      monthEarnings,
      payments,
      worker,
      user: req.user,
      active: "earningsManage",
    });

  } catch (error) {
    console.error("Error loading worker dashboard:", error);
    res.status(500).render("error", { error: "Failed to load earnings dashboard" });
  }
};

module.exports = { getEarningsDashboard };
