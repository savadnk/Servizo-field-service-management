const axios = require("axios");
const {Admin} = require("../../models/User");
const Invoice = require("../../models/Invoice");


const createRazorpaySubAccount = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await Admin.findById(adminId);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }

    if (!admin.bankAccountNumber || !admin.ifscCode) {
      return res.status(400).json({
        success: false,
        message: "Please add bank details before connecting Razorpay.",
      });
    }

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    // ✅ FIXED: Use the correct v2 endpoint
    const response = await axios.post(
      "https://api.razorpay.com/v2/accounts", // ← Changed from /v1/route/link_accounts
      {
        email: admin.email,
        phone: admin.phone,
        type: "route", // ← Required field
        legal_business_name: admin.companyName,
        business_type: "individual", // or "partnership", "private_limited", etc.
        contact_name: admin.name,
        profile: {
          category: "healthcare", // ← Required - adjust to your business
          subcategory: "clinic",   // ← Required - adjust to your business
          addresses: {
            registered: {
                street1: "507, Business Building",        // ← Required
              street2: "MG Road",                      // ← Required (was missing)
              city: "Mumbai",
              state: "MAHARASHTRA",                    // ← Use exact state names
              postal_code: "400001",                   // ← String format
              country: "IN"
            }
          }
        },
        legal_info: {
          pan: "AAACL1234C", // ← Add PAN to admin model if needed
          // gst: "18AABCU9603R1ZM" // ← Optional GST
        }
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    admin.razorpayAccountId = response.data.id;
    admin.isRazorpayOnboarded = true;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Razorpay account connected successfully!",
      razorpayAccountId: response.data.id,
    });
  } catch (error) {
    console.error(
      "Error creating Razorpay sub-account:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to connect with Razorpay. Try again later.",
    });
  }
};

// controllers/paymentController.js
// const createRazorpaySubAccount = async (req, res) => {
//   try {
//     const admin = await Admin.findById(req.user.id);

//     // Generate a fake Razorpay account ID
//     admin.razorpayAccountId = `fake_lac_${Date.now()}`;
//     admin.isRazorpayOnboarded = true;
//     await admin.save();

//     res.status(200).json({
//       success: true,
//       message: "Mock Razorpay sub-account linked successfully (dev mode)",
//       accountId: admin.razorpayAccountId,
//     });
//   } catch (err) {
//     console.error("Mock subaccount error:", err);
//     res.status(500).json({ error: "Failed to create mock sub-account" });
//   }
// };


const viewInvoice = async (req, res) => {
   const invoice = await Invoice.findById(req.params.id)
   .populate("admin", "name email companyName")
    .populate("job")
    .populate("customer", "name email")
    .lean();
    console.log(invoice);


  if (!invoice) {
    return res.status(404).render("error", { error: "Invoice not found" });
  }

  res.render("admin/invoiceDetail", {
    invoice,
    title: "Invoice Detail",
    user: req.user,
    layout: false,
  });
}


module.exports = { createRazorpaySubAccount, viewInvoice };
