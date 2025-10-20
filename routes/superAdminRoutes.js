const express = require("express")
const authorizeRole = require("../middlewares/roleMiddleware")
const { authenticate } = require("../middlewares/authMiddleware")
const upload = require("../middlewares/upload")
const getDashboard = require("../controllers/super_admin/dashboardController")
const { getAgencies,updateAgencyStatus, approveAgency, blockAgency, } = require("../controllers/super_admin/adminController")
const {getWorkers, blockWorker, unblockWorker} = require("../controllers/super_admin/workerController")
const { getCustomers, blockCustomer, unblockCustomer } = require("../controllers/super_admin/customerController")
const { getAllJobs } = require("../controllers/super_admin/jobController")
const {  getNotifications ,markAsRead, } = require("../controllers/super_admin/notificationController")
const {   getProfile, updateProfile, changePassword, updateProfilePhoto } = require("../controllers/super_admin/settingController")
const { getRevenueDashboard } = require("../controllers/super_admin/revenueController")


const router = express.Router();


router.get("/dashboard", authenticate, authorizeRole("superadmin"), getDashboard)

router.get("/admins", authenticate, authorizeRole("superadmin"), getAgencies)
router.post("/admins/:id/approve", authenticate, authorizeRole("superadmin"), approveAgency);
router.post("/admins/:id/block", authenticate, authorizeRole("superadmin"), blockAgency);
router.post("/admins/:agencyId/status", authenticate, authorizeRole("superadmin"), updateAgencyStatus);

router.get("/workers", authenticate, authorizeRole("superadmin"), getWorkers);
router.post("/workers/:id/block", authenticate, authorizeRole("superadmin"), blockWorker)
router.post("/workers/:id/unblock", authenticate, authorizeRole("superadmin"),unblockWorker)

router.get("/customers", authenticate, authorizeRole("superadmin"), getCustomers)
router.post("/customers/:id/block", authenticate, authorizeRole("superadmin"), blockCustomer)
router.post("/customers/:id/unblock", authenticate, authorizeRole("superadmin"), unblockCustomer)

router.get("/jobs", authenticate, authorizeRole("superadmin"), getAllJobs)

router.get("/notifications", authenticate, authorizeRole("superadmin"), getNotifications)
router.post("/notifications/:id/read", authenticate, authorizeRole("superadmin"), markAsRead)

router.get("/settings", authenticate, authorizeRole("superadmin"), getProfile);
router.post("/settings/update", authenticate, authorizeRole("superadmin"), updateProfile);
router.post("/settings/password", authenticate, authorizeRole("superadmin"), changePassword);
router.post("/settings/photo", authenticate,  authorizeRole("superadmin"), upload.single("profilePhoto"), updateProfilePhoto);

router.get("/platform", authenticate, authorizeRole("superadmin"), getRevenueDashboard);

module.exports = router;            
