const express = require("express")
const authorizeRole = require("../middlewares/roleMiddleware")
const  {authenticate, checkBlocked} = require("../middlewares/authMiddleware")
const ensureProfileComplete = (require("../middlewares/ensureProfileComplete"))
const upload  = require("../middlewares/upload");
const {getDashboard} = require("../controllers/customer/dashboardController")   
const {   getNewJobForm, createJob } = require("../controllers/customer/serviceRequestController");
const {  getJobDetails} = require("../controllers/customer/servicesController");
const { getNotifications, markAsRead, deleteNotification } = require("../controllers/customer/notificationController"); 
const {  getServiceHistory, postWorkerFeedback } = require("../controllers/customer/serviceHistoryController");
const {   getSettings, updateProfile, updatePassword, updateProfilePhoto,addAddress,deleteAddress } = require("../controllers/customer/settingController")
const { getCustomerInvoices, viewInvoice, createOrder, verifyPayment } = require("../controllers/customer/paymentController");

const router = express.Router();

router.get("/dashboard",authenticate, checkBlocked, authorizeRole("customer"), getDashboard)

router.get("/request", authenticate, authorizeRole("customer"), getNewJobForm);
router.post("/request", authenticate, authorizeRole("customer"), createJob);

router.get("/jobs", authenticate, authorizeRole("customer"), getJobDetails);

router.get("/notifications", authenticate, authorizeRole("customer"), getNotifications);
router.post("/notifications/:id/read", authenticate, authorizeRole("customer"), markAsRead);
router.post("/notifications/:id/delete", authenticate, authorizeRole("customer"), deleteNotification);

router.get("/history", authenticate, authorizeRole("customer"), getServiceHistory);
router.post("/history/feedback", authenticate, authorizeRole("customer"), postWorkerFeedback);

router.get("/settings", authenticate, authorizeRole("customer"),  getSettings)
router.post("/settings/update", authenticate, authorizeRole("customer"), updateProfile)
router.post("/settings/photo", authenticate, authorizeRole("customer"), upload.single("profilePhoto"), updateProfilePhoto)
router.post("/settings/password", authenticate, authorizeRole("customer"), updatePassword)
router.post("/settings/address/add", authenticate, authorizeRole("customer"), addAddress)
router.post("/settings/address/:id/delete", authenticate, authorizeRole("customer"), deleteAddress)

router.get("/invoices", authenticate, authorizeRole("customer"), getCustomerInvoices);
router.get("/invoice/:id", authenticate, authorizeRole("customer"), viewInvoice);
// router.post("/invoice/:id/pay", authenticate, authorizeRole("customer"), payInvoice);
router.get("/invoice/:id/pay", authenticate, authorizeRole("customer"), createOrder);
router.post("/payment/verify", authenticate, authorizeRole("customer"), verifyPayment);


module.exports = router;