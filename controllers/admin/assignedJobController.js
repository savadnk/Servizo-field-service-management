const Job = require("../../models/Job");
const JobAssignment = require("../../models/JobAssignment");
const { Worker, Customer, Admin } = require("../../models/User");
const Address = require("../../models/Address");
const Notification = require("../../models/Notification");



const getAssignedJobs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const adminId = req.user.id;

     const admin = await Admin.findById(adminId);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }
    const { status } = req.query;

     let filter = { admin: adminId };
    if (status) filter.status = status;

    // Fetch all jobs with customer + assignment
   const jobs = await Job.find({ admin: adminId,  ...filter  })
  .populate("customer", "name phone email")
  .populate("address", "label street city pincode")
  .sort({ createdAt: -1 })// ✅ populate specific fields
  .lean();


    const jobIds = jobs.map(job => job._id);

    const assignments = await JobAssignment.find({ job: { $in: jobIds } })
      .populate("worker", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    const assignmentMap = {};
    assignments.forEach(assign => {
      assignmentMap[assign.job.toString()] = assign.worker;
    });

    // Available workers (for dropdown)
    const workers = await Worker.find({ admin: adminId }).select("name phone skills").lean();

const formattedJobs = jobs.map((job, index) => ({
  jobId: `J${(index + 1).toString().padStart(3, "0")}`,
  _id: job._id,
  serviceType: job.serviceType,
  customer: job.customer ? {
    name: job.customer.name,
    phone: job.customer.phone
  } : { name: "Unknown", phone: "N/A" },
  worker: assignmentMap[job._id.toString()] || null,
  location: job.address
    ? {
        label: job.address.label,
        street: job.address.street,
        city: job.address.city,
        pincode: job.address.pincode
      }
    : null,
  scheduled: job.deadline ? new Date(job.deadline).toLocaleDateString() : "Not Scheduled",
  status: job.status
}));

            console.log(formattedJobs)
    
    const activeWorkers = await Worker.find({ availability: true, admin: adminId})


    res.render("admin/assignedJobs", {
      title: "Assigned Jobs",
      user: req.user,
      jobs: formattedJobs,
      workers,
      admin,
      activeWorkers,
      selectedStatus: status || "",
      active: "assignManage"
    });

  } catch (error) {
    console.error("Get Assigned Jobs Error:", error);
    res.status(500).render("error", { error: "Failed to load assigned jobs" });
  }
};

const deleteJob = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const { id } = req.params;

    await Job.findByIdAndDelete(id);
    await JobAssignment.deleteOne({ job: id });

  
    res.redirect("/admin/jobs");
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).render("error", { error: "Failed to delete job" });
  }
};


// 📌 Assign / Reassign Worker
const assignWorker = async (req, res) => {
  try {
    const { id } = req.params; // Job ID
    const { workerId } = req.body; // Worker to assign
    console.log(req.body);

    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const job = await Job.findById(id).populate("customer", "name");
   
    if (!job) {
      return res.status(404).render("error", { error: "Job not found" });
    }

    const worker = await Worker.findById(workerId).select("name");
    if (!worker) {
      return res.status(404).render("error", { error: "Worker not found" });
    }


    const assign = await JobAssignment.findOne({ job: job._id });

    
    if (assign){
      assign.worker = workerId;
      assign.status = "Assigned";
     
      await assign.save()
    }else{
       const jobAssignment = new JobAssignment({
      job: job._id,
      worker: workerId,
      status: "Assigned",

    }) 
    await jobAssignment.save();
    }

    await Job.findByIdAndUpdate(id, { status: "Assigned" });

     await Notification.create({
      user: workerId,               // the admin who should see it
      message: `You have been assigned a new job: "${job.serviceType}".`,
      type: "Job",
      isRead: false,
    });

    // ✅ Create notification for admin confirming the assignment
    await Notification.create({
      user: job.customer._id,       // the customer who should see it
      message: `Worker "${worker.name}" has been assigned to your job "${job.serviceType}" .`,
      type: "Job",
      isRead: false,
    });

    res.redirect(`/admin/jobs?success=${encodeURIComponent('Assigned worker')}`);
  } catch (error) {
    console.error("Assign/Reassign Worker Error:", error);
    res.status(500).render("error", { error: "Failed to assign worker" });
  }
};

// 📌 Reschedule Job
const rescheduleJob = async (req, res) => {
  try {
  
    
    const { id } = req.params; // Job ID
    const { newDate } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const job = await Job.findById(id);
    console.log(job);
    if (!job) {
      return res.status(404).render("error", { error: "Job not found" });
    }

    job.deadline  = newDate;
    job.status = "Pending";
    await job.save();

    
    res.redirect(`/admin/jobs?success=${encodeURIComponent('Date Rescheduled')}`);
  } catch (error) {
    console.error("Reschedule Job Error:", error);
    res.status(500).render("error", { error: "Failed to reschedule job" });
  }
};




const getCreateJobForm = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    // Fetch customers (for assigning jobs)
    const customers = await Customer.find().select("name phone").lean();

    // Fetch admin's own services
    const adminData = await Admin.findById(req.user.id).select("servicesOffered").lean();
    const services = adminData?.servicesOffered || [];

    // ✅ Fetch admin’s saved addresses
    const addresses = await Address.find({ customer: req.user.id }).lean();

    res.render("admin/createJob", {
      title: "Create Job",
      user: req.user,
      customers,
      services,
      addresses, // ✅ Pass to EJS
      active: "assignManage"
    });
  } catch (error) {
    console.error("Get Create Job Form Error:", error);
    res.status(500).render("error", { error: "Failed to load job form" });
  }
};


const createJob = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const {
      customer,
      address, // existing address ID
      newLabel,
      newStreet,
      newCity,
      newState,
      newPincode,
      newLatitude,
      newLongitude,
      serviceType,
      description,
      deadline
    } = req.body;

    console.log("Form Data:", req.body); // Debug

    // ✅ Validate Customer
    if (!customer || customer.trim() === "") {
      return res.status(400).render("error", { error: "Please select a valid customer" });
    }

    let addressId;

    // ✅ Check if admin added a new address
    if (newStreet && newCity && newState && newPincode && newLatitude && newLongitude) {
      const newAddress = new Address({
        customer,
        label: newLabel || "",
        street: newStreet,
        city: newCity,
        state: newState,
        pincode: newPincode,
        latitude: parseFloat(newLatitude),
        longitude: parseFloat(newLongitude),
        address: `${newStreet}, ${newCity}, ${newState} - ${newPincode}`,
        isDefault: false
      });

      await newAddress.save();
      addressId = newAddress._id;
    } else if (address) {
      // ✅ Use existing address
      addressId = address;
    } else {
      return res.status(400).render("error", { error: "Please select or add a valid address" });
    }

    // ✅ Create Job
    const job = new Job({
      customer,
      admin: req.user.id,
      address: addressId,
      serviceType,
      description,
      deadline,
      status: "Pending",
    });

    await job.save();

    res.redirect(`/admin/jobs?success=${encodeURIComponent("New job created successfully")}`);
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).render("error", { error: "Failed to create job" });
  }
};





module.exports = { getAssignedJobs, deleteJob, assignWorker, rescheduleJob, getCreateJobForm, createJob };
