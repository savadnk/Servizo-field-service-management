const Notification = require("../../models/Notification");
const {  Admin } = require("../../models/User");


const getNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!", layout: false });
    }
     const admin = await Admin.findById(req.user.id);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

      

    res.render("admin/notifications", {
      title: "Notifications",
      user: req.user,
      notifications,
      admin,  
      active: "notificationManage"
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).render("error", { error: "Failed to load notifications", layout: false });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.redirect("/admin/notifications");
  } catch (error) {
    console.error("Mark as Read Error:", error);
    res.status(500).render("error", { error: "Failed to update notification", layout: false });
  }
};

// 📌 Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.redirect("/admin/notifications");
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).render("error", { error: "Failed to delete notification", layout: false });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
