const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Customer, Admin, Worker } = require("../../models/User");

const getAllJobs = async (req, res) => {
  try {
    // Fetch jobs with customer + admin info
    const jobs = await Job.find()
      .populate("customer", "name email")
      .populate("admin", "companyName name")
      .lean();

    // Fetch assignments with worker info
    const assignments = await JobAssignment.find()
      .populate("worker", "name email")
      .populate("job", "_id")
      .lean();
    console.log(assignments);

    // Group assignments by jobId
   const assignmentMap = {};

for (const assign of assignments) {
  if (!assign.job || !assign.job._id) continue; // Skip if job reference missing
  const jobId = assign.job._id.toString();
  if (!assignmentMap[jobId]) assignmentMap[jobId] = [];
  assignmentMap[jobId].push(assign);
}



    // Build jobData for EJS
    const jobData = jobs.flatMap((job, index) => {
      const jobAssignments = assignmentMap[job._id] || [];

      // If no worker assigned → one row with "Unassigned"
      if (jobAssignments.length === 0) {
        return {
          shortId: `RQ${(index + 1).toString().padStart(3, "0")}`,
          id: job._id,
          customer: job.customer?.name || "N/A",
          agency: job.admin?.companyName || job.admin?.name || "N/A",
          worker: "Unassigned",
          serviceType: job.serviceType || "General",
          status: job.status || "Pending",
          scheduledDate: job.deadline
            ? job.deadline.toDateString()
            : "Not Scheduled",
          completedDate: "Not Completed",
        };
      }

      // If multiple workers assigned → separate rows
      return jobAssignments.map((assign) => ({
        shortId: `RQ${(index + 1).toString().padStart(3, "0")}`,
        id: job._id,
        customer: job.customer?.name || "N/A",
        agency: job.admin?.companyName || job.admin?.name || "N/A",
        worker: assign.worker?.name || "Unassigned",
        serviceType: job.serviceType || "General",
        status: assign.status || job.status,
        scheduledDate: job.deadline
          ? job.deadline.toDateString()
          : "Not Scheduled",
        completedDate: assign.completedAt
          ? assign.completedAt.toDateString()
          : "Not Completed",
      }));
    });

    console.log(jobData);


    res.render("superadmin/jobs", {
      jobs: jobData,
       user: req.user,
      title: "SuperAdmin Service Requests",
      active: "jobManage",
    });
  } catch (error) {
    console.error("Get All Jobs Error:", error);
    res.status(500).render("error", { error: "Failed to load jobs", layout: false });
  }
};

module.exports = {
  getAllJobs,
};
