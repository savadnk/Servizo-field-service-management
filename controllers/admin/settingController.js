const { Admin, User } =require("../../models/User")
const {AVAILABLE_SERVICES} = require("../../config/serviceList"); 
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { cloudinary } = require("../../config/cloudinary");




const getAdminProfile = async (req, res) => {
  try {
    
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!", layout: false });
    }

    const admin = await Admin.findById(req.user.id).lean();
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }

    const isProfileComplete = admin.companyName && admin.servicesOffered?.length > 0;

    res.render("admin/settings", {
      title: "Profile Settings",
      user: req.user,   // logged-in user session
      admin, 
      AVAILABLE_SERVICES,
      isProfileComplete,           // full admin data from DB
      active: "settingManage",
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).render("error", { error: "Failed to load profile", layout: false });
  }
};



const updateAdminProfile = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).render("error", { error: "Access denied!", layout: false });
    }

    const { companyName, servicesOffered, name } = req.body;

    await Admin.findByIdAndUpdate(
      req.user.id,
      {
        name,
        companyName,
        servicesOffered: Array.isArray(servicesOffered)
          ? servicesOffered
          : servicesOffered.split(",").map((s) => s.trim()),
      },
      { new: true }
    );

    res.redirect(`/admin/settings?success=${encodeURIComponent('Profile Updated')}`);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).render("error", { error: "Failed to update profile", layout: false });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    console.log("📤 Upload request received");
    console.log("User ID:", req.user?.id);
    console.log("File:", req.file);

    if (!req.file) {
      return res.redirect(
        `/admin/settings?error=${encodeURIComponent("No file uploaded or invalid format")}`
      );
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.redirect(
        `/admin/settings?error=${encodeURIComponent("Admin account not found")}`
      );
    }

    // 🧹 Optional: delete old photo if it’s on Cloudinary
    if (admin.profilePhoto && admin.profilePhoto.includes("cloudinary.com")) {
      try {
        const parts = admin.profilePhoto.split("/");
        const publicId = parts.slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("⚠️ Cloudinary delete warning:", e.message);
      }
    }

    // ✅ Save new photo URL
    admin.profilePhoto = req.file.path;
    await admin.save();

    console.log("✅ Profile photo updated successfully");

    // ✅ Redirect to settings page with success message
    return res.redirect(
      `/admin/settings?success=${encodeURIComponent("Profile Photo Updated")}`
    );

  } catch (error) {
    console.error("❌ Full error details:", error);
    return res.redirect(
      `/admin/settings?error=${encodeURIComponent("Photo upload failed: " + (error.message || error))}`
    );
  }
};



const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

  

    const admin = await Admin.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.redirect(`/admin/settings?passwordChanged=1&error=${encodeURIComponent( "Current password is incorrect!")}`);
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.redirect(`/admin/settings?passwordChanged=1&success=${encodeURIComponent('Profile Updated')}`);
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).render("error", { error: "Failed to change password", layout: false });
  }
};

// POST - Save bank details
// const saveBankDetails = async (req, res) => {
//   try {
//     const { bankAccountNumber, ifscCode } = req.body;
//     const admin = await Admin.findById(req.user.id);

//     admin.bankAccountNumber = bankAccountNumber;
//     admin.ifscCode = ifscCode;
//     await admin.save();

//     res.redirect("/admin/settings?success=Bank details saved successfully");
//   } catch (err) {
//     console.error("Error saving bank details:", err);
//     res.status(500).send("Error saving bank details");
//   }
// };



module.exports = {
  
  getAdminProfile,
  updateAdminProfile,
  updateProfilePhoto,
  changePassword,
  // saveBankDetails,
};