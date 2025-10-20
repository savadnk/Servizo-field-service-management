const Notification = require("../../models/Notification");
const { Customer } = require("../../models/User");


const getNotifications = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).render("error", { error: "Access denied!", layout: false});
    }
    const customer = await Customer.findById(req.user.id);
    
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.render("customer/notifications", {
      title: "Notifications",
      user: req.user,
      customer,
      notifications,
      active: "notificationManage"
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).render("error", { error: "Failed to load notifications" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.redirect("/customer/notifications");
  } catch (error) {
    console.error("Mark as Read Error:", error);
    res.status(500).render("error", { error: "Failed to update notification" });
  }
};

// 📌 Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.redirect("/customer/notifications");
  } catch (error) {
    console.error("Delete Notification Error:", error);
    res.status(500).render("error", { error: "Failed to delete notification" });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
