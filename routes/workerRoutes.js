const express = require("express")
const authorizeRole = require("../middlewares/roleMiddleware")
const{ authenticate, checkBlocked } = require("../middlewares/authMiddleware")
const ensureProfileComplete = (require("../middlewares/ensureProfileComplete"))
const upload  = require("../middlewares/upload");
const {getWorkerDashboard, chooseCompanyPage, joinCompany} = require("../controllers/worker/dashboardController")
const {getMyJobs, updateJobStatus} = require("../controllers/worker/jobController")
const {getScheduleView} = require("../controllers/worker/scheduleController")
const { getNotifications, markAsRead, deleteNotification } = require("../controllers/worker/notificationController"); 
const { updateProfilePhoto, changePassword, getWorkerProfile, updateWorkerProfile, toggleAvailability } = require("../controllers/worker/settingController");
const { getWorkerMap } = require("../controllers/worker/mapController");
const {getEarningsDashboard } = require("../controllers/worker/paymentController")


const router = express.Router();

router.get("/dashboard",authenticate, checkBlocked, authorizeRole("worker"), getWorkerDashboard)
router.get("/choose-company", authenticate, authorizeRole("worker"), chooseCompanyPage)
router.post("/join-company", authenticate, authorizeRole("worker"), joinCompany)


router.get("/jobs", authenticate, authorizeRole("worker"), getMyJobs);
router.post("/jobs/:id/status", authenticate, authorizeRole("worker"), updateJobStatus);

router.get("/maps", authenticate, authorizeRole("worker"), getWorkerMap);

router.get("/schedule", authenticate, authorizeRole("worker"), getScheduleView);

router.get("/notifications", authenticate, authorizeRole("worker"), getNotifications);
router.post("/notifications/:id/read", authenticate, authorizeRole("worker"), markAsRead);
router.post("/notifications/:id/delete", authenticate, authorizeRole("worker"), deleteNotification);

router.get("/settings", authenticate, authorizeRole("worker"),  getWorkerProfile)
router.post("/settings/update", authenticate, authorizeRole("worker"), updateWorkerProfile)
router.post("/settings/availability", authenticate, authorizeRole("worker"), toggleAvailability)
router.post("/settings/photo", authenticate, authorizeRole("worker"), upload.single("profilePhoto"), updateProfilePhoto)
router.post("/settings/password", authenticate, authorizeRole("worker"), changePassword)

router.get("/earnings", authenticate, authorizeRole("worker"), getEarningsDashboard)


module.exports = router;