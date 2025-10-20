const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Worker } = require("../../models/User");
const Notification = require("../../models/Notification");


// ✅ Get all jobs assigned to worker
const getMyJobs = async (req, res) => {
  try {
    const workerId = req.user.id;

    const worker = await Worker.findById(workerId);
    const workerAdmin =  await Worker.findById(workerId).select("admin").lean();
    if (!workerAdmin.admin) {
      return res.status(403).redirect("/worker/choose-company");
    }

    const { status } = req.query;

    let filter = { worker: workerId };
    if (status) filter.status = status;



    const jobs = await JobAssignment.find({ worker: workerId, ...filter })
      .populate({
        path: "job",
        populate: [
          { path: "customer", select: "name phone email" },
          { path: "address", select: "street city state pincode label" },
        ],
      })
      .sort({ assignedAt: -1 })
      .lean();

    // ✅ Filter out invalid/null jobs
    const validJobs = jobs.filter(assign => assign.job !== null);
 

    res.render("worker/jobs", {
      jobs: validJobs,
      user: req.user,
      worker,
      selectedStatus: status || "",
      active: "jobManage",
      title: "Worker Jobs",
    });
  } catch (error) {
    console.error("Get My Jobs Error:", error);
    res.status(500).render("error", { error: "Failed to load jobs" });
  }
};


// ✅ Update job status (Accept, In Progress, Paused, Completed)
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params; // JobAssignment id
    const { status } = req.body;

    const validStatuses = ["Accepted", "Paused", "Completed","Pending"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const jobAssign = await JobAssignment.findById(id)
      .populate({ path: "job", select: "serviceType customer admin" }) // ✅ Fetch customer ID from job
      .populate("worker", "name ");
      console.log(jobAssign);

    if (!jobAssign) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Update assignment
    jobAssign.status = status;
    jobAssign.updatedAt = new Date();
    if (status === "Completed") {
      jobAssign.completedAt = new Date();
    }
    await jobAssign.save();

    // ✅ Also update Job model status
    if (jobAssign.job) {
      await Job.findByIdAndUpdate(jobAssign.job._id, { status });
    }

    // ✅ Update Worker model completedJobs when completed
    if (status === "Completed") {
      await Worker.findByIdAndUpdate(jobAssign.worker, {
        $inc: { completedJobs: 1 }
      });
    }

    // --- Notification Logic ---
    const adminId = jobAssign.job?.admin;
    console.log(adminId);
    const customerId = jobAssign.job?.customer;
    const workerName = jobAssign.worker?.name || "A worker";
    const serviceType = jobAssign.job?.serviceType || "the job";

    // ✅ 1. Notify customer when worker accepts the job
    if (status === "Accepted") {
      if (customerId) { // Only send if customer exists
        await Notification.create({
          user: customerId,
          message: `Your job "${serviceType}" has been accepted by ${workerName}.`,
          type: "Job",
        });
      }
    }

    // ✅ 2. Notify admin and customer when job is completed
    if (status === "Completed") {
      // For Admin
      if (adminId) { // Only send if admin exists
        await Notification.create({
          user: adminId,
          message: `Job "${serviceType}" has been marked as completed by ${workerName}.`,
          type: "Job",
        });
      }
      // For Customer
      if (customerId) { // Only send if customer exists
        await Notification.create({
          user: customerId,
          message: `Your job "${serviceType}" has been completed.`,
          type: "Job",
        });
      }
    }
    res.redirect("/worker/jobs");
  } catch (error) {
    console.error("Update Job Status Error:", error);
    res.status(500).json({ error: "Failed to update job status" });
  }
};

module.exports = { getMyJobs, updateJobStatus };
