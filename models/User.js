const mongoose = require("mongoose")

// base schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    profilePhoto: { type: String, default: null },
    role: {
        type: String,
        enum: ["superadmin", "admin", "customer", "worker"],
        required: true
    },
    isVerified: { type: Boolean, default: false},
    resetToken: { type: String, default: null },
    resetTokenExpire: { type: Date, default: null },

}, {
    discriminatorKey: "role",
    timestamps: true
})

const User = mongoose.model("User", userSchema);

// Super admin schema
const SuperAdmin = User.discriminator("superadmin", new mongoose.Schema({}));

//Admin schema
const Admin = User.discriminator("admin", new mongoose.Schema({

    companyName: { type: String, default: null },
    servicesOffered: [{ type: String }],
    verified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ["Active", "Blocked", "Pending"],
        default: "Pending"
    },
         // 🔐 Razorpay Route Integration Fields
  razorpayAccountId: {
    type: String, // example: "lac_KyC8k9kT0s8gTu"
    default: null,
  },
  isRazorpayOnboarded: { type: Boolean, default: false },

  // 🏦 Bank Information (for linked account creation)
    bankAccountNumber: { type: String },
    ifscCode: { type: String },

    businessAddress: {
        street1: String,
        city: String, 
        state: String,
        postalCode: String,
        country: { type: String, default: "IN" }
    },
    panNumber: {type: String},
    businessCategory: { type: String, default: "Field Service" },
    businessSubcategory: { type: String, default: "Agency" }
}))

//worker schema
const Worker = User.discriminator("worker", new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "admin" , default: null},
    skills: [{ type: String }],
    availability: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingData: {
      total: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    revenue: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Blocked"], default: "Active" },
 
}))

// customer schema
const Customer = User.discriminator("customer", new mongoose.Schema({
    paymentMethods: { type: String, default: "UPI" },
    customerType: {
        type: String,
        enum: ["Individual", "Company"],
        default: "Individual"
    }, 
    status: {
        type: String, enum: ["Active", "Blocked"], default: "Active"
    }
}))


module.exports = {
    User,
    SuperAdmin,
    Admin,
    Worker,
    Customer

}





