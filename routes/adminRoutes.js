const express = require("express")
const authorizeRole = require("../middlewares/roleMiddleware")
const{ authenticate, checkBlocked } = require("../middlewares/authMiddleware")
const ensureProfileComplete = (require("../middlewares/ensureProfileComplete"))
const upload  = require("../middlewares/upload");
const injectProfileStatus = require("../middlewares/profileStatus")
const { getAdminDashboard } = require("../controllers/admin/dashboardController")
const {  getAdminProfile,  updateAdminProfile, updateProfilePhoto,changePassword, saveBankDetails } = require("../controllers/admin/settingController")
const { getServiceRequests, deleteServiceRequest} = require("../controllers/admin/serviceRequestController")
const { getAssignedJobs, deleteJob , assignWorker, rescheduleJob, getCreateJobForm, createJob} = require("../controllers/admin/assignedJobController")
const { getWorkers, addWorker} = require("../controllers/admin/workerController");
const { getNotifications, markAsRead, deleteNotification } = require("../controllers/admin/notificationController")
const {  getInvoicesAndPayments, createInvoicePage, createInvoice,  getWorkerPayments, getNewWorkerPayForm, workerShare, createWorkerPayOrder, verifyWorkerPayment } = require("../controllers/admin/invoiceController");
const { createRazorpaySubAccount, viewInvoice } = require("../controllers/admin/paymentController");
const Invoice = require("../models/Invoice");


const router = express.Router();
// router.use(authenticate, authorizeRole("admin"), injectProfileStatus);
router.get("/pending", authenticate, authorizeRole("admin"),async (req, res) => {
  res.render("admin/pending", { title: "Pending", user: req.user});
});

router.get("/dashboard",authenticate, checkBlocked, authorizeRole("admin"),injectProfileStatus,  getAdminDashboard )

router.get("/services", authenticate, authorizeRole("admin"), getServiceRequests )
router.post("/services/:id/delete", authenticate, authorizeRole("admin"), deleteServiceRequest)


router.get("/jobs", authenticate, authorizeRole("admin"), getAssignedJobs )
router.post("/jobs/:id/delete", authenticate, authorizeRole("admin"), deleteJob )
router.post("/jobs/:id/assign", authenticate, authorizeRole("admin"), assignWorker )
router.post("/jobs/:id/reschedule", authenticate, authorizeRole("admin"), rescheduleJob )
router.get("/jobs/create", authenticate, authorizeRole("admin"),ensureProfileComplete, getCreateJobForm);
router.post("/jobs/create", authenticate, authorizeRole("admin"), createJob );

router.get("/workers", authenticate, authorizeRole("admin"),  getWorkers);
router.post("/workers/add", authenticate, authorizeRole("admin"),ensureProfileComplete, addWorker);

router.get("/notifications", authenticate, authorizeRole("admin"), getNotifications);
router.post("/notifications/:id/read", authenticate, authorizeRole("admin"), markAsRead);
router.post("/notifications/:id/delete", authenticate, authorizeRole("admin"), deleteNotification);

router.get("/settings", authenticate, authorizeRole("admin"),  getAdminProfile)
router.post("/settings/update", authenticate, authorizeRole("admin"), updateAdminProfile)
router.post("/settings/photo", authenticate, authorizeRole("admin"), upload.single("profilePhoto"), updateProfilePhoto)
router.post("/settings/password", authenticate, authorizeRole("admin"), changePassword)
router.post("/settings/bank", authenticate, authorizeRole("admin"), saveBankDetails) 

router.post("/payment/create-subaccount", authenticate, authorizeRole("admin"), createRazorpaySubAccount);

router.get("/invoices", authenticate, authorizeRole("admin"), getInvoicesAndPayments);
router.get("/invoices/create", authenticate, authorizeRole("admin"), createInvoicePage);
router.post("/invoices/create", authenticate, authorizeRole("admin"), createInvoice);
router.get("/invoices/worker", authenticate, authorizeRole("admin"), getWorkerPayments);
router.get("/invoices/worker/new", authenticate, authorizeRole("admin"), getNewWorkerPayForm);
router.get("/invoices/worker/new/:jobId", authenticate, authorizeRole("admin"), workerShare);
router.post("/worker/create-order", authenticate, authorizeRole("admin"), createWorkerPayOrder);
router.post("/invoices/worker/verify", authenticate, authorizeRole("admin"), verifyWorkerPayment);
// routes/admin/invoiceRoutes.js
router.get("/invoice/:id", authenticate, authorizeRole("admin"), viewInvoice);




module.exports = router;                                                                                                                                                                                                                                                  