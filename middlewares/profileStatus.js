// middleware/injectProfileStatus.js
const { Admin } = require("../models/User");

const injectProfileStatus = async (req, res, next) => {
        console.log("user",req.user);

  if (req.user?.role === "admin") {
    try {
      const admin = await Admin.findById(req.user.id);
      res.locals.isProfileComplete = admin.companyName && admin.servicesOffered?.length > 0;

          console.log("Admin profile check:", res.locals.isProfileComplete);

    } catch (err) {
      console.error("Failed to inject profile status:", err);
      res.locals.isProfileComplete = false; // safe fallback
    }
  } else {
    res.locals.isProfileComplete = true; // non-admins don’t need this
  }
  next();

  
};

module.exports = injectProfileStatus;