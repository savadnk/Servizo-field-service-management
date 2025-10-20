const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Customer } = require("../../models/User");


const getJobDetails = async (req, res) => {
  try {

    const customerId = req.user.id;
    const customer = await Customer.findById(customerId);

    const { status } = req.query;
   
    let filter = { customer: customerId };
    if (status) filter.status = status

    // Fetch jobs for this customer
    const jobs = await Job.find({ customer: customerId,...filter })
      .populate("customer", "name email phone")
      .populate("admin", "name email phone companyName") // agency/admin
      .populate("address")
      .lean();

    


    // Fetch assignments for these jobs
    const assignments = await JobAssignment.find({
      job: { $in: jobs.map(j => j._id) }
    })
      .populate("worker", "name email phone profilePhoto skills")
      .lean();

    // Map jobId → assignment
    const assignmentMap = {};
    assignments.forEach(a => {
      assignmentMap[a.job.toString()] = a;
    });

    res.render("customer/myRequests", {
      title: "Job Details",
      user: req.user,
      active: "serviceManage",
      jobs,
      selectedStatus: status || "",
      assignmentMap,
      customer,
    });
  } catch (err) {
    console.error("getJobDetails error:", err);
    res.redirect("/customer/myRequests?error=Failed to load job details");
  }
};

module.exports = { getJobDetails };
