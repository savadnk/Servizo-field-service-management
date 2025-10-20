// middleware/ensureProfileComplete.js
const {Admin} = require("../models/User");

const ensureProfileComplete = async (req, res, next) => {
  if (req.user.role !== "admin") return next();

  const admin = await Admin.findById(req.user.id);

  if (!admin.companyName || admin.servicesOffered.length === 0) {
    return res.status(403).json({
      success: false,
      message: "Please complete your profile before accessing this feature.",
    });
  }

  next();
};

module.exports = ensureProfileComplete;
