const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const Feedback = require("../../models/Feedback"); // use your Feedback model
const { Worker, Customer } = require("../../models/User");

const getServiceHistory = async (req, res) => {
  try {
    const customerId = req.user.id;
    const customer = await Customer.findById(customerId);

    const { filter } = req.query

    // Fetch completed jobs of this customer
    let jobs = await Job.find({
      customer: customerId,
      status: "Completed"
    })
      .populate("admin", "companyName")
      .lean();

    // Job assignments (workers)
    const assignments = await JobAssignment.find({
      job: { $in: jobs.map(j => j._id) }
    })
      .populate("worker", "name email profilePhoto skills")
      .lean();

    const assignmentMap = {};
    assignments.forEach(a => {
      assignmentMap[a.job.toString()] = a;
    });

    // Customer feedbacks for these jobs
    const feedbacks = await Feedback.find({
      customer: customerId,
      job: { $in: jobs.map(j => j._id) }
    }).lean();

    const feedbackMap = {};
    feedbacks.forEach(f => {
      feedbackMap[f.job.toString()] = f;
    });

    // Filter based on rating status
    if (filter === "rate") {
      jobs = jobs.filter(j => feedbackMap[j._id.toString()]);
    } else if (filter === "unrate") {
      jobs = jobs.filter(j => !feedbackMap[j._id.toString()]);
    }

    // Add shortId
    jobs = jobs.map((job, index) => ({
      ...job,
      shortId: `JB${(index + 1).toString().padStart(3, "0")}`
    }));

    res.render("customer/serviceHistory", {
      title: "Service History",
      user: req.user,
      active: "historyManage",
      jobs,
      customer,
      assignmentMap,
      feedbackMap,
      selectedFilter: filter || "all"
    });
  } catch (err) {
    console.error("getServiceHistory error:", err);
    res.status(500).send("Error loading service history");
  }
};


// Submit Feedback (only customer rating)
const postWorkerFeedback = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { jobId, workerId, rating } = req.body;

    // 1. Save/update feedback of this customer for this job
    let feedback = await Feedback.findOne({ job: jobId, customer: customerId });
    if (feedback) {
      feedback.rating = rating;
      await feedback.save();
    } else {
      await Feedback.create({
        job: jobId,
        worker: workerId,
        customer: customerId,
        rating
      });
    }

    // 2. Recalculate worker’s overall rating
    if (workerId) {
      const allFeedbacks = await Feedback.find({ worker: workerId });
      if (allFeedbacks.length > 0) {
        const total = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
        const avg = total / allFeedbacks.length;

        await Worker.findByIdAndUpdate(workerId, { 
          rating: avg.toFixed(1) 
        });
      }
    }

    res.redirect("/customer/history");
  } catch (err) {
    console.error("postWorkerFeedback error:", err);
    res.status(500).send("Error submitting feedback");
  }
};

module.exports = { getServiceHistory, postWorkerFeedback };
