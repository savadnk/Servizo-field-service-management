const Job = require("../../models/Job");
const { Customer } = require("../../models/User");
const Address = require("../../models/Address");
const { Admin } = require("../../models/User");
const Notification = require("../../models/Notification")



// ✅ Render new job form
const getNewJobForm = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    const addresses = await Address.find({ customer: req.user.id });

    // Fetch all admins and their service types
    const admins = await Admin.find({}, "companyName servicesOffered");
    // servicesOffered = e.g. ["Plumbing", "Cleaning"]



    res.render("customer/newRequest", {
      title: "New Service Request",
      active: "requestManage",
      user: req.user,
      customer,
      addresses,
      admins
    });
  } catch (err) {
    console.error("getNewJobForm error:", err);
    res.status(500).send("Error loading form");
  }
};


// ✅ Handle new job submission
const createJob = async (req, res) => {
  try {
    const { serviceType, address, description, deadline, admin } = req.body;

    console.log(req.body);


    const newJob = new Job({
      customer: req.user.id,
      admin,
      address,
      serviceType,
      description,
      deadline,

    });

    await newJob.save();

    await Notification.create({
      user: admin,               // the admin who should see it
      message: `New job request from ${req.user.name} (${serviceType})`,
      type: "Job",
      isRead: false,
    });


    res.redirect(`/customer/request?success=${encodeURIComponent("Service created successfully") }`);
  } catch (err) {
    console.error("createJob error:", err);
    res.status(500).send("Error creating job");
  }
};

module.exports = {
  getNewJobForm,
  createJob
};