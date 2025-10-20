const Notification = require("../../models/Notification");

// ✅ Create a new notification
const createNotification = async ({ user, message, type }) => {
    try {
        const notification = new Notification({
            user,
            message,
            type,
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Create Notification Error:", error);
        throw error;
    }
};

// ✅ Get notifications (for a specific user or all if superadmin)
const getNotifications = async (req, res) => {
    try {
        if (req.user.role !== "superadmin") {
            return res.status(403).render("error", { error: "Access denied!" });
        }
        const notifications = await Notification.find({type: "System"})
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .lean();

        res.render("superadmin/notifications", {
            title: "SuperAdmin Notifications",
            user: req.user,
            notifications,
            active: "notificationManage",
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).render("error", { error: "Failed to load notifications" });
    }
};

// ✅ Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await Notification.findByIdAndUpdate(id, { isRead: true });

        res.redirect("/superadmin/notifications");
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        res.status(500).render("error", { error: "Failed to mark as read" });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
};
