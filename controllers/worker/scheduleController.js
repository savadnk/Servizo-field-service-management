const JobAssignment = require("../../models/JobAssignment");
const Job = require("../../models/Job");
const { Worker } = require("../../models/User");


const getScheduleView = async (req, res) => {
  try {
     const workerId = req.user.id;
     const worker = await Worker.findById(workerId);
        const workerAdmin =  await Worker.findById(workerId).select("admin").lean();
        if (!workerAdmin.admin) {
          return res.status(403).redirect("/worker/choose-company");
        }


    // Fetch jobs assigned to this worker
    const assignments = await JobAssignment.find({ worker: workerId })
      .populate({
        path: "job",
        select: "serviceType description deadline",
        populate: { path: "customer", select: "name" }
      })
      .lean();

    // Transform jobs into FullCalendar format
    const events = assignments
      .filter(a => a.job) // skip invalid
      .map(a => ({
        id: a._id,
        title: `${a.job.serviceType} - ${a.job.customer?.name || "Customer"}`,
        start: a.job.deadline,// using deadline as event date
        allDay: false,
        extendedProps: {
          description: a.job.description,
          status: a.status
        }
      }));

    res.render("worker/schedule", {
      user: req.user,
      title: "My Schedule",
      active: "scheduleManage",
      worker,
      events: JSON.stringify(events) // send as JSON string for client
    });
  } catch (err) {
    console.error("Schedule View Error:", err);
    res.status(500).render("error", { error: "Failed to load schedule" });
  }
};

module.exports = { getScheduleView };
