const { Customer } = require("../../models/User");
const Address = require("../../models/Address");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Render settings page
const getSettings = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    const addresses = await Address.find({ customer: req.user.id });

    res.render("customer/settings", {
      title: "Settings",
      user: req.user,
      active: "settingManage",
      customer,
      addresses
    });
  } catch (err) {
    console.error("getSettings error:", err);
    res.status(500).send("Error loading settings");
  }
};

// Update profile info (name, email, phone)
const updateProfile = async (req, res) => {
  try {
    const { name, customerType  } = req.body;

    await Customer.findByIdAndUpdate(req.user.id, { name, customerType  });
    res.redirect(`/customer/settings?success=${encodeURIComponent("Profile Updated Successfully")}`);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).send("Error updating profile");
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const customer = await Customer.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res.status(400).redirect(
        `/customer/settings?error=${encodeURIComponent("current password is incorrect")}`
      );;
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).redirect(
        `/customer/settings?error=${encodeURIComponent("passwords do not match")}`
      );;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    customer.password = hashed;
    await customer.save();

    res.redirect(`/customer/settings?success=${encodeURIComponent("Password Updated successfully")}`);
  } catch (err) {
    console.error("updatePassword error:", err);
    res.status(500).send("Error updating password");
  }
};

// Update profile photo
const updateProfilePhoto = async (req, res) => {
  try {
 if (!req.file) {
      return res.redirect(
        `/customer/settings?error=${encodeURIComponent("No file uploaded or invalid format")}`
      );
    }
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.redirect(
        `/customer/settings?error=${encodeURIComponent("customer account not found")}`
      );
    }

    // 🧹 Optional: delete old photo if it’s on Cloudinary
        if (customer.profilePhoto && customer.profilePhoto.includes("cloudinary.com")) {
          try {
            const parts = customer.profilePhoto.split("/");
            const publicId = parts.slice(-2).join("/").split(".")[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.warn("⚠️ Cloudinary delete warning:", e.message);
          }
        }
    customer.profilePhoto = req.file.path;
    await customer.save();

    res.redirect(`/customer/settings?success=${encodeURIComponent("Profile Photo Updated")}`);
  } catch (err) {
    console.error("updateProfilePhoto error:", err);
    res.status(500).send("Error updating photo");
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, pincode, latitude, longitude } = req.body;

    await Address.create({
      customer: req.user.id,
      label,
      street,
      city,
      state,
      pincode,
      latitude,
      longitude,
      address: `${street}, ${city}, ${state}, ${pincode}`
    });

    res.redirect(`/customer/settings?success=${encodeURIComponent("Address Added Successfully")}`);
  } catch (err) {
    console.error("addAddress error:", err);
    res.status(500).send("Error adding address");
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, customer: req.user.id });
    res.redirect(`/customer/settings?success=${encodeURIComponent("Address Deleted Successfully")}`);
  } catch (err) {
    console.error("deleteAddress error:", err);
    res.status(500).send("Error deleting address");
  }
};

module.exports = {
  getSettings,
  updateProfile,
  updatePassword,
  updateProfilePhoto,
  addAddress,
  deleteAddress
};
