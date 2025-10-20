const Invoice = require("../../models/Invoice");
const Payment = require("../../models/Payment");
const Notification = require("../../models/Notification");
const crypto = require("crypto");
// const razorpay = require("../../config/razorpay")
const { Admin , Customer } = require("../../models/User");
const Razorpay = require("razorpay");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// View all invoices of customer
const getCustomerInvoices = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    
    const invoiceStatus = req.query.invoiceStatus || "All"; // All, Paid, Unpaid

    let query = { customer: req.user.id };

    // Apply filter for invoices at the database level
    if (invoiceStatus === "Paid") {
      query.status = "Paid";
    } else if (invoiceStatus === "Unpaid") {
      query.status = { $ne: "Paid" }; // $ne means "not equal to"
    }

    const invoices = await Invoice.find(query)
      .populate("admin", "companyName ")
      .populate("job", "serviceType").lean();

    res.render("customer/invoiceList", { 
      invoices, 
      invoiceStatus,
      user: req.user,
      customer,
       active: "paymentManage" ,
        title: "Invoices"});
  } catch (err) {
    res.status(500).send("Error fetching invoices");
  }
};

// View single invoice
const viewInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
  .populate("customer", "name email")
    .populate("admin", "companyName email")
    .populate("job", "serviceType description")
    .lean();

    console.log(invoice);

  res.render("customer/invoiceDetail", { invoice , layout: false});
};




// ✅ STEP 1: Create order (without transfers for now)
const createOrder = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await Invoice.findById(invoiceId).populate("admin customer");

    if (!invoice) return res.status(404).send("Invoice not found");

    const admin = await Admin.findById(invoice.admin._id);

    const serviceAmount = Math.round(invoice.serviceAmount * 100);
    const platformFee = Math.round(invoice.platformFee * 100);
    const total = serviceAmount + platformFee;

    const orderPayload = {
      amount: total,
      currency: "INR",
      receipt: `invoice_${invoice._id}`,
      notes: {
        invoiceId: invoice._id.toString(),
        adminId: admin._id.toString(),
      },
    };

    // ✅ Only add transfers if admin has sub-account and Route is enabled
    if (admin.razorpayAccountId && process.env.SUPERADMIN_RAZORPAY_ACCOUNT) {
      orderPayload.transfers = [
        {
          account: admin.razorpayAccountId,
          amount: serviceAmount,
          currency: "INR",
          notes: { purpose: "Service payment" },
        },
        {
          account: process.env.SUPERADMIN_RAZORPAY_ACCOUNT,
          amount: platformFee,
          currency: "INR",
          notes: { purpose: "Platform fee" },
        },
      ];
    } else {
      console.log("⚠️ Route not enabled or sub-account missing → skipping transfers");
    }

    const order = await razorpay.orders.create(orderPayload);

    res.render("customer/checkout", {
      key: process.env.RAZORPAY_KEY_ID,
      order,
      invoice,
      user: req.user, active: "paymentManage" , title: "Invoices",
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error.error || error);
    res.status(500).send("Failed to create Razorpay order");
  }
};


// const createOrder = async (req, res) => {
//   try {
//     const { invoiceId } = req.body;
//     const invoice = await Invoice.findById(invoiceId).populate("admin");

//     const order = await razorpay.orders.create({
//       amount: invoice.totalAmount * 100, // in paise
//       currency: "INR",
//       receipt: `rcpt_${invoice._id}`,
//     });

//     invoice.paymentOrderId = order.id;
//     await invoice.save();

//     res.status(200).json({ order });
//   } catch (err) {
//     console.error("Order creation failed:", err);
//     res.status(500).json({ error: "Unable to create payment order" });
//   }
// };




// Step 2: Verify payment success callback (Webhook or POST)
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      adminId,
      serviceAmount,
      platformFee,
      totalAmount,
    } = req.body;

    // ✅ Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).send("Invalid signature!");
    }

    // ✅ Update invoice as paid
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        status: "Paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true }
    );

    // ✅ Create payment record
    const payment = await Payment.create({
      invoice: invoice._id,
      customer: req.user.id,
      admin: adminId,
      amountPaid: serviceAmount,
      platformFee: platformFee,
      totalAmount: totalAmount,
      paymentMethod: "Razorpay",
      transactionId: razorpay_payment_id,
      status: "Paid",
      paidAt: new Date(),
    });

    const service = await Invoice.findById(invoiceId).populate("job", "serviceType");
    

     await Notification.create({
          user: adminId,               // the admin who should see it
          message:  `Payment received for job "${service.job?.serviceType || 'N/A'}" by  ${req.user?.name || 'Unknown'}.`,
          type: "Payment",
          isRead: false,
        });



    console.log("✅ Payment recorded:", payment._id);

    // ✅ Redirect customer
    res.redirect("/customer/invoices?success=Payment Successful");
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).send("Payment verification failed");
  }
};

module.exports = { getCustomerInvoices, viewInvoice,  createOrder, verifyPayment  };
