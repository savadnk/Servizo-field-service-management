const { Worker, User, Admin } =require("../../models/User")
const bcrypt = require("bcryptjs");
const {WORKER_SKILLS} = require("../../config/serviceList"); 
const { cloudinary } = require("../../config/cloudinary");




const getWorkerProfile = async (req, res) => {
  try {
    
    if (req.user.role !== "worker") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

   

    const worker = await Worker.findById(req.user.id).lean();
    const admin = await Admin.findById(worker.admin).lean()
    console.log(admin)


    const isProfileComplete =  worker.skills?.length > 0;

    res.render("worker/settings", {
      title: "Profile Settings",
      user: req.user,   // logged-in user session
      worker, 
      admin,
      WORKER_SKILLS,
      isProfileComplete,           // full worker data from DB
      active: "settingManage",
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).render("error", { error: "Failed to load profile" });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).render("error", { error: "Access denied!" });
    }

    const {  skills, name } = req.body;

    await Worker.findByIdAndUpdate(
      req.user.id,
      {
        name,
        skills: Array.isArray(skills)
          ? skills
          : skills.split(",").map((s) => s.trim()),
      },
      { new: true }
    );

    res.redirect(`/worker/settings?success=${encodeURIComponent('Profile Updated')}`);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).render("error", { error: "Failed to update profile" });
  }
};

// Toggle availability (AJAX)
const toggleAvailability = async (req, res) => {
  try {
    let { available } = req.body; // boolean (true/false)
    // if string is accidentally sent, normalize it
    if (typeof available === "string") {
      available = available === "true";
    }

    const worker = await Worker.findByIdAndUpdate(
      req.user.id,
      { availability: available },
      { new: true }
    );

    res.json({ success: true, availability: worker.availability });
  } catch (err) {
    console.error("Toggle Availability Error:", err);
    res.status(500).json({ success: false, error: "Failed to update availability" });
  }
};


const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect(
        `/worker/settings?error=${encodeURIComponent("No file uploaded or invalid format")}`
      );
    }

    const worker = await Worker.findByIdAndUpdate(req.user.id);
     if (!worker) {
      return res.redirect(
        `/worker/settings?error=${encodeURIComponent("Admin account not found")}`
      );
    }

    // 🧹 Optional: delete old photo if it’s on Cloudinary
        if (worker.profilePhoto && worker.profilePhoto.includes("cloudinary.com")) {
          try {
            const parts = worker.profilePhoto.split("/");
            const publicId = parts.slice(-2).join("/").split(".")[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.warn("⚠️ Cloudinary delete warning:", e.message);
          }
        }

        worker.profilePhoto = req.file.path;
        await worker.save();
    

    return res.redirect(`/worker/settings?success=${encodeURIComponent('Profile Photo Updated')}`);
  } catch (error) {
    console.error("Update Photo Error:", error);
    res.status(500).render("error", { error: "Failed to update profile photo" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;


    const worker = await Worker.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, worker.password);
    if (!isMatch) {
      return res.redirect(`/worker/settings?passwordChanged=1&error=${encodeURIComponent( "Current password is incorrect!")}`);   
    }

    worker.password = await bcrypt.hash(newPassword, 10);
    await worker.save();

    res.redirect(`/worker/settings?passwordChanged=1&success=${encodeURIComponent('Profile Updated')}`);
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).render("error", { error: "Failed to change password", layout: false });
  }
};

module.exports = {
  
  getWorkerProfile,
  updateWorkerProfile,
  updateProfilePhoto,
  changePassword,
  toggleAvailability,
};