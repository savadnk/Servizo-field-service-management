const Job = require("../models/Job");
const JobAssignment = require("../models/JobAssignment");
const Address = require("../models/Address");
const Feedback = require("../models/Feedback");

// ----------------- Dashboard Stats -----------------
const getDashboard = async (req, res) => {
  try {
    const customerId = req.user.id;

    const totalRequests = await Job.countDocuments({ customer: customerId });
    const completedJobs = await Job.countDocuments({ customer: customerId, status: "Completed" });
    const activeJobs = await Job.countDocuments({
      customer: customerId,
      status: { $in: ["Assigned", "In Progress"] }
    });
    const pendingPayments = 2; // mock for now → later integrate with Payments schema

    res.render("customer/dashboard", {
      totalRequests,
      completedJobs,
      activeJobs,
      pendingPayments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Dashboard Error");
  }
};

// ----------------- New Service Request -----------------
const newRequestForm = (req, res) => {
  res.render("customer/newRequest");
};

const createRequest = async (req, res) => {
  try {
    const { serviceType, description, deadline, addressId } = req.body;

    await Job.create({
      customer: req.user.id,
      serviceType,
      description,
      deadline,
      address: addressId
    });

    res.redirect("/customer/my-requests?success=Request submitted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create service request");
  }
};

// ----------------- My Requests -----------------
const getMyRequests = async (req, res) => {
  try {
    const jobs = await Job.find({ customer: req.user.id })
      .populate("address")
      .populate({
        path: "customer",
        select: "name email phone"
      })
      .sort({ createdAt: -1 });

    const assignments = await JobAssignment.find({ job: { $in: jobs.map(j => j._id) } })
      .populate("worker");

    res.render("customer/myRequests", { jobs, assignments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading requests");
  }
};

// ----------------- Notifications -----------------
const getNotifications = async (req, res) => {
  try {
    // Mock for now → replace with Notifications collection
    const notifications = [
      { text: "Job #123 assigned to a worker", time: "5m ago" },
      { text: "Your payment is due for Job #456", time: "1h ago" }
    ];
    res.render("customer/notifications", { notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading notifications");
  }
};

// ----------------- Service History -----------------
const getServiceHistory = async (req, res) => {
  try {
    const jobs = await Job.find({ customer: req.user.id, status: "Completed" })
      .populate("address")
      .populate({
        path: "customer",
        select: "name"
      });

    res.render("customer/history", { jobs });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading service history");
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { jobId, rating, text, workerId } = req.body;

    await Feedback.create({
      job: jobId,
      customer: req.user.id,
      worker: workerId,
      rating,
      text
    });

    res.redirect("/customer/history?success=Feedback submitted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting feedback");
  }
};

// ----------------- Profile -----------------
const getProfile = async (req, res) => {
  try {
    const addresses = await Address.find({ customer: req.user.id });
    res.render("customer/profile", { user: req.user, addresses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await Customer.findByIdAndUpdate(req.user.id, { name, phone });
    res.redirect("/customer/profile?success=Profile updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // add bcrypt compare + hash
    res.redirect("/customer/profile?success=Password updated");
  } catch (err) {
    res.status(500).send("Error updating password");
  }
};

module.exports = {
  getDashboard,
  newRequestForm,
  createRequest,
  getMyRequests,
  getNotifications,
  getServiceHistory,
  submitFeedback,
  getProfile,
  updateProfile,
  updatePassword
};


const express = require("express");
const router = express.Router();
const {
  getDashboard,
  newRequestForm,
  createRequest,
  getMyRequests,
  getNotifications,
  getServiceHistory,
  submitFeedback,
  getProfile,
  updateProfile,
  updatePassword
} = require("../controllers/customerController");

const { authenticate, authorizeRole } = require("../middleware/auth");

router.get("/dashboard", authenticate, authorizeRole("customer"), getDashboard);

// Requests
router.get("/new-request", authenticate, authorizeRole("customer"), newRequestForm);
router.post("/new-request", authenticate, authorizeRole("customer"), createRequest);

router.get("/my-requests", authenticate, authorizeRole("customer"), getMyRequests);

// Notifications
router.get("/notifications", authenticate, authorizeRole("customer"), getNotifications);

// Service History + Feedback
router.get("/history", authenticate, authorizeRole("customer"), getServiceHistory);
router.post("/feedback", authenticate, authorizeRole("customer"), submitFeedback);

// Profile
router.get("/profile", authenticate, authorizeRole("customer"), getProfile);
router.post("/profile/update", authenticate, authorizeRole("customer"), updateProfile);
router.post("/profile/password", authenticate, authorizeRole("customer"), updatePassword);

module.exports = router;



// 3. EJS Files (Samples)

// 📂 views/customer/

// dashboard.ejs
// <div class="container mt-4 text-white">
//   <h2>Customer Dashboard</h2>
//   <div class="row mt-3">
//     <div class="col-md-3"><div class="card p-3 bg-dark">Total Requests: <%= totalRequests %></div></div>
//     <div class="col-md-3"><div class="card p-3 bg-dark">Completed Jobs: <%= completedJobs %></div></div>
//     <div class="col-md-3"><div class="card p-3 bg-dark">Active Jobs: <%= activeJobs %></div></div>
//     <div class="col-md-3"><div class="card p-3 bg-dark">Pending Payments: <%= pendingPayments %></div></div>
//   </div>
// </div>

// newRequest.ejs
{/* <div class="container mt-4 text-white">
  <h2>New Service Request</h2>
  <form method="POST" action="/customer/new-request">
    <div class="mb-3">
      <label class="form-label">Service Type</label>
      <select name="serviceType" class="form-control" required>
        <option value="Cleaning">Cleaning</option>
        <option value="Plumbing">Plumbing</option>
        <option value="Event Setup">Event Setup</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Deadline</label>
      <input type="date" name="deadline" class="form-control" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Description</label>
      <textarea name="description" class="form-control"></textarea>
    </div>
    <button type="submit" class="btn btn-success">Submit Request</button>
  </form>
</div> */}

// myRequests.ejs
// <div class="container mt-4 text-white">
//   <h2>My Service Requests</h2>
//   <% jobs.forEach(job => { %>
//     <div class="card p-3 mb-3 bg-dark">
//       <h5><%= job.serviceType %> - <%= job.status %></h5>
//       <p><%= job.description %></p>
//       <small>Deadline: <%= job.deadline.toDateString() %></small>
//     </div>
//   <% }) %>
// </div>

// notifications.ejs
// <div class="container mt-4 text-white">
//   <h2>Notifications</h2>
//   <ul class="list-group">
//     <% notifications.forEach(n => { %>
//       <li class="list-group-item bg-dark text-white">
//         <%= n.text %> <span class="text-muted float-end"><%= n.time %></span>
//       </li>
//     <% }) %>
//   </ul>
// </div>

// history.ejs
// <div class="container mt-4 text-white">
//   <h2>Service History</h2>
//   <table class="table table-dark">
//     <thead><tr><th>Job</th><th>Service</th><th>Date</th><th>Feedback</th></tr></thead>
//     <tbody>
//       <% jobs.forEach(job => { %>
//         <tr>
//           <td><%= job._id %></td>
//           <td><%= job.serviceType %></td>
//           <td><%= job.updatedAt.toDateString() %></td>
//           <td>
//             <form action="/customer/feedback" method="POST" class="d-flex gap-2">
//               <input type="hidden" name="jobId" value="<%= job._id %>">
//               <input type="hidden" name="workerId" value="<%= job.assignedWorker || '' %>">
//               <input type="number" name="rating" min="1" max="5" class="form-control" required>
//               <input type="text" name="text" placeholder="Review" class="form-control">
//               <button class="btn btn-success btn-sm">Submit</button>
//             </form>
//           </td>
//         </tr>
//       <% }) %>
//     </tbody>
//   </table>
// </div>

// profile.ejs
// <div class="container mt-4 text-white">
//   <h2>Profile Settings</h2>
//   <form action="/customer/profile/update" method="POST">
//     <div class="mb-3">
//       <label>Name</label>
//       <input type="text" class="form-control" name="name" value="<%= user.name %>">
//     </div>
//     <div class="mb-3">
//       <label>Email</label>
//       <input type="email" class="form-control" value="<%= user.email %>" readonly>
//     </div>
//     <div class="mb-3">
//       <label>Phone</label>
//       <input type="tel" class="form-control" name="phone" value="<%= user.phone %>">
//     </div>
//     <button type="submit" class="btn btn-success">Save Changes</button>
//   </form>
// </div>