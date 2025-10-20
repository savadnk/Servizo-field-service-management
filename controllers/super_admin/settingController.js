const { User } = require("../../models/User");
const bcrypt = require("bcryptjs");
// ✅ Render Profile Page
const getProfile = async (req, res) => {
  try {
    console.log("🔍 req.user:", req.user);
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const userData = await User.findById(req.user.id)
    const phone = userData?.phone

    res.render("superadmin/settings", {
      title: "SuperAdmin Profile",
      phone, 
      user: req.user,
      active: "settingManage",
      error: null,
      success: null,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).render("error", { error: "Failed to load profile" });
  }
};

// ✅ Update Profile Info
const updateProfile = async (req, res) => {
  try {
    console.log("🔍 req.user:", req.user);
console.log("🔍 req.user._id:", req.user.id);
   

    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }
    const { name, email, phone } = req.body;

    // ✅ Use base User model to find — works regardless of discriminator
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.render("superadmin/settings", {
        title: "SuperAdmin Profile",
        user: req.user,
        error: "User not found",
        success: null,
        active: "settingManage",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    await user.save();

    res.render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user, // updated user
      success: "Profile updated successfully",
      error: null,
      active: "settingManage",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user: req.user,
      error: "Failed to update profile",
      success: null,
      active: "settingManage",
    });
  }
};
// ✅ Update Profile Photo
const updateProfilePhoto = async (req, res) => {
  try {
    console.log("🔍 req.user:", req.user);
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }
    if (!req.file) {
      return res.render("superadmin/settings", {
        title: "SuperAdmin Profile",
        user: req.user,
        error: "No file uploaded",
        success: null,
        active: "settingManage",
      });
    }
    const photoPath = "/uploads/profiles/" + req.file.filename;
    const user = await User.findById(req.user.id);
    if (!user) throw new Error("User not found");
    user.profilePhoto = photoPath;
    await user.save();
    res.render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user, // updated user
      success: "Profile photo updated successfully",
      error: null,
      active: "settingManage",
    });
  } catch (error) {
    console.error("Update Profile Photo Error:", error);
    res.status(500).render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user: req.user,
      error: "Failed to update profile photo",
      success: null,
      active: "settingManage",
    });
  }
};
// ✅ Change Password
const changePassword = async (req, res) => {

  try {
    
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).render("error", { error: "Access denied!" });
    }
    const { newPassword, confirmNewPassword } = req.body;
    if (!newPassword || newPassword !== confirmNewPassword) {
      return res.render("superadmin/settings", {
        title: "SuperAdmin Profile",
        user: req.user,
        error: "Passwords do not match",
        success: null,
        active: "settingManage",
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) throw new Error("User not found");
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user,
      success: "Password updated successfully",
      error: null,
      active: "settingManage",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).render("superadmin/settings", {
      title: "SuperAdmin Profile",
      user: req.user,
      error: "Failed to change password",
      success: null,
      active: "settingManage",
    });
  }
};
module.exports = { getProfile, updateProfile, changePassword, updateProfilePhoto };
