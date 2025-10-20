const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Worker } = require("../../models/User");

const getWorkerMap = async (req, res) => {
  try {
    const workerId = req.user.id;
        const workerAdmin =  await Worker.findById(workerId).select("admin").lean();
        console.log(workerAdmin);
        const worker = await Worker.findById(workerId);
        if (!workerAdmin.admin) {
          return res.status(403).redirect("/worker/choose-company");
        }

    // Find all job assignments for this worker
   const assignments = await JobAssignment.find({ worker: workerId })
  .populate({
    path: "job",
    match: { status: { $ne: "Completed" } }, // ✅ Exclude Completed jobs
    populate: {
      path: "address",
      select: "street city state pincode latitude longitude"
    }
  });




    // Format for frontend map markers
 const jobs = assignments
  .filter(a => a.job && a.job.address)
  .map(a => ({
    id: a.job._id.toString(),  // ✅ use job ID for map matching
    serviceType: a.job.serviceType,
    status: a.status,
    deadline: a.job.deadline,
    street: a.job.address.street,
    city: a.job.address.city,
    state: a.job.address.state,
    pincode: a.job.address.pincode,
    lat: a.job.address.latitude,
    lng: a.job.address.longitude
  }));


     


    res.render("worker/map", { jobs, user: req.user, active: "mapManage", title: "Map", worker });
  } catch (error) {
    console.error("Worker Map Error:", error);
    res.status(500).render("error", { error: "Failed to load map" });
  }
};

module.exports = { getWorkerMap };
