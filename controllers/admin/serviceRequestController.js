const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const {  Admin } = require("../../models/User");



const getServiceRequests = async (req, res) => {
    try {
        
        if (req.user.role !== "admin") {
            return res.status(403).render("error", { error: "Access denied!" });
        }
        const admin = await Admin.findById(req.user.id);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }
        const adminId = req.user.id;
        
        const { status } = req.query;

           // ✅ Build filter only for status
    let filter = { admin: adminId };
    if (status) filter.status = status;

    

        // Fetch jobs belonging to this admin
        const jobs = await Job.find({ admin: adminId, ...filter })
            .populate("customer", "name email") // customer details
            .lean();

            console.log(jobs)

        // Fetch job assignments for these jobs
        const jobIds = jobs.map(job => job._id);
        const assignments = await JobAssignment.find({ job: { $in: jobIds } })
            .populate("worker", "name email")
            .lean();

        // Map assignments to jobId for quick lookup
        const assignmentMap = {};
        assignments.forEach(assign => {
            assignmentMap[assign.job.toString()] = assign.worker;
        });

        // Build formatted data
        const formattedJobs = jobs.map((job, index) => ({
            requestId: `REQ${(index + 1).toString().padStart(4, "0")}`,
            customerName: job.customer?.name || "Unknown",
            serviceType: job.serviceType,
            assignedWorker: assignmentMap[job._id.toString()]
                ? assignmentMap[job._id.toString()].name
                : "Not Assigned",
            status: job.status,
            jobId: job._id
        }));
        

        res.render("admin/services", {
            title: "Service Requests",
            user: req.user,
            admin,
            requests: formattedJobs,
             selectedStatus: status || "",
            active: "serviceManage"
        });

    } catch (error) {
        console.error("Get Service Requests Error:", error);
        res.status(500).render("error", { error: "Failed to load service requests" });
    }
};

const deleteServiceRequest = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const { id } = req.params;

    await Job.findByIdAndDelete(id);

    
    res.redirect("/admin/services");
  } catch (error) {
    console.error("Delete Service Request Error:", error);
    res.status(500).render("error", { error: "Failed to delete service request" });
  }
};




module.exports = { getServiceRequests, deleteServiceRequest};
