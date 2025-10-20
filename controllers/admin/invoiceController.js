const Invoice = require("../../models/Invoice");
const Job = require("../../models/Job");
const WorkerPay = require("../../models/WorkerPay");
const { Worker, Admin} = require("../../models/User");
const JobAssignment = require("../../models/JobAssignment");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Notification = require("../../models/Notification");


const PLATFORM_FEE_PERCENT = 10;

// Combined: Get invoices + worker payments
const getInvoicesAndPayments = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }

    // 🧠 Extract filters from query
    const invoiceFilter = req.query.invoiceStatus || "All"; // All, Paid, Unpaid
    const paymentFilter = req.query.paymentStatus || "All"; // All, Paid, Unpaid

    // 1️⃣ Fetch all invoices (for Customer Invoices table)
    let allInvoices = await Invoice.find({ admin: req.user.id })
      .populate("customer", "name email")
      .populate({
        path: "job",
        populate: { path: "customer", select: "name" },
      })
      .lean();

    // Add shortId field
    allInvoices = allInvoices.map((invoice, index) => ({
      ...invoice,
      shortId: `INV${(index + 1).toString().padStart(3, "0")}`,
    }));

    // Apply filter for invoices
    let filteredInvoices = allInvoices;
    if (invoiceFilter === "Paid") {
      filteredInvoices = allInvoices.filter((inv) => inv.status === "Paid");
    } else if (invoiceFilter === "Unpaid") {
      filteredInvoices = allInvoices.filter((inv) => inv.status !== "Paid");
    }

    // 2️⃣ Customer-paid invoices (for Worker Payments)
    const customerPaidInvoices = allInvoices.filter((inv) => inv.status === "Paid");

    // 3️⃣ Fetch worker payments
    const pays = await WorkerPay.find({ admin: req.user.id })
      .populate("worker", "name email")
      .populate("job", "title")
      .lean();

    const paidJobIds = pays.map((p) => p.job._id.toString());

    // Apply filter for worker payments
    let filteredPaidInvoices = customerPaidInvoices;
    if (paymentFilter === "Paid") {
      filteredPaidInvoices = customerPaidInvoices.filter((inv) =>
        paidJobIds.includes(inv.job._id.toString())
      );
    } else if (paymentFilter === "Unpaid") {
      filteredPaidInvoices = customerPaidInvoices.filter(
        (inv) => !paidJobIds.includes(inv.job._id.toString())
      );
    }

    res.render("admin/invoices", {
      invoices: filteredInvoices,          // Filtered for section 1
      customerPaidInvoices: filteredPaidInvoices, // Filtered for section 2
      pays,
      paidJobIds,
      active: "paymentManage",
      title: "Invoices & Worker Payments",
      user: req.user,
      admin,
      invoiceFilter,
      paymentFilter,
    });
  } catch (err) {
    console.error("❌ Invoice/Payment Fetch Error:", err);
    res.status(500).send("Error loading invoices and payments");
  }
};



 
// Other functions remain same
const createInvoicePage = async (req, res) => {
  try {
    // 1️⃣ Find all jobs for this admin
    const allJobs = await Job.find({ admin: req.user.id, status: "Completed" })
      .populate("customer", "name email")
      .lean();

    // 2️⃣ Get all jobs already invoiced
    const invoicedJobs = await Invoice.find({ admin: req.user.id })
      .select("job")
      .lean();

    // 3️⃣ Extract job IDs that already have invoices
    const invoicedJobIds = invoicedJobs.map(inv => inv.job.toString());

    // 4️⃣ Filter jobs that are NOT in invoices
    const jobsWithoutInvoice = allJobs.filter(
      job => !invoicedJobIds.includes(job._id.toString())
    );

    // 5️⃣ Render only jobs not invoiced yet
    res.render("admin/createInvoice", {
      jobs: jobsWithoutInvoice,
      active: "paymentManage",
      title: "Create Invoice",
      user: req.user,
    });
  } catch (err) {
    console.error("❌ Error fetching jobs for invoice creation:", err);
    res.status(500).send("Failed to fetch jobs for invoice creation");
  }
};


const createInvoice = async (req, res) => {
  try {
    const { job: jobId, customer, serviceAmount, totalAmount } = req.body;
    const platformFee = (serviceAmount * PLATFORM_FEE_PERCENT) / 100;

    await Invoice.create({
      job: jobId,
      admin: req.user.id,
      customer,
      serviceAmount,
      platformFee,
      totalAmount,
      status: "Unpaid",
    });

    // ✅ Notify the customer that a new invoice has been generated
    const jobDetails = await Job.findById(jobId).select("serviceType").lean();
    const serviceType = jobDetails?.serviceType || "your recent job";

    await Notification.create({
      user: customer,
      message: `An invoice for job "${serviceType}" is now available for payment.`,
      type: "Invoice",
      isRead: false,
    });

    res.redirect("/admin/invoices");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create invoice");
  }
};

// ✅ Show all worker payments
const getWorkerPayments = async (req, res) => {
  try {
    // 1️⃣ Get all customer-paid invoices for this admin
    const paidInvoices = await Invoice.find({
      admin: req.user.id,
      status: "Paid",
    })
      .populate({
        path: "job",
        populate: { path: "customer", select: "name" },
      })
      .lean();

    // 2️⃣ Get all worker payments for this admin
    const paidWorkerPays = await WorkerPay.find({ admin: req.user.id })
      .select("job")
      .lean();
      console.log(paidWorkerPays);


    // 3️⃣ Extract job IDs already paid to workers
    const paidJobIds = paidWorkerPays.map(p => p.job.toString());


    // 4️⃣ Render EJS with all data
    res.render("admin/invoices", {
      invoices: paidInvoices,
      pays: paidWorkerPays,
      paidJobIds, // ✅ make sure this line is included
      active: "paymentManage",
      title: "Manage Payments",
      user: req.user,
    });
  } catch (err) {
    console.error("❌ Failed to fetch worker payments:", err);
    res.status(500).send("Failed to fetch worker payments");
  }
};


// ✅ Show new payment form

const getNewWorkerPayForm = async (req, res) => {
  try {
    // 1️⃣ Find all paid invoices for this admin
    const paidInvoices = await Invoice.find({ admin: req.user.id, status: "Paid" })
      .populate("job")
      .lean();

    // 2️⃣ Extract job IDs from invoices
    const jobIds = paidInvoices.map(inv => inv.job?._id).filter(Boolean);

    // 3️⃣ Find those jobs
    const jobs = await Job.find({ _id: { $in: jobIds } })
      .populate("customer", "name")
      .lean();

    // 4️⃣ Find job assignments for these jobs
    const assignments = await JobAssignment.find({
      job: { $in: jobIds },
    })
      .populate("worker", "name email")
      .lean();

    // 5️⃣ Render page
    res.render("admin/workerPayNew", {
      jobs,
      assignments,
      active: "paymentManage",
      title: "Pay Worker",
      user: req.user,
    });
  } catch (err) {
    console.error("❌ Error loading worker pay form:", err);
    res.status(500).send("Failed to load form");
  }
};

const workerShare = async (req, res) => { 
  try {
    const { jobId } = req.params;

    // ✅ Fetch job
    const job = await Job.findById(jobId)
      .populate("customer", "name")
      .lean();

    // ✅ Fetch assignment (to get worker)
    const assignment = await JobAssignment.findOne({ job: jobId })
      .populate("worker", "name email")
      .lean();

    // ✅ Fetch related invoice (for service amount)
    const invoice = await Invoice.findOne({ job: jobId, admin: req.user.id })
      .lean();
      console.log(assignment);


    if (!job || !assignment || !invoice) {
      return res.status(404).render("error", { error: "Job, worker, or invoice not found" });
    }

    // ✅ Use serviceAmount from Invoice (example: 70% goes to worker)
    const workerAmount = invoice.serviceAmount * 0.7;

    res.render("admin/workerPayNew", {
      job,
      assignment,
      invoice,
      workerAmount,
      active: "paymentManage",
      title: "Pay Worker",
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load worker pay form");
  }
};




const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order for Worker Payment
const createWorkerPayOrder = async (req, res) => {
  try {
    const { amount, jobId, workerId } = req.body;

    // Create Razorpay order (amount in paise)
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `workerpay_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount,
      key: process.env.RAZORPAY_KEY_ID,
      jobId,
      workerId,
    });
  } catch (err) {
    console.error("❌ Error creating Razorpay order:", err);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// ✅ Verify Payment & Save WorkerPay Record
const verifyWorkerPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, jobId, workerId, amount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment verified — save record
      await WorkerPay.create({
        job: jobId,
        worker: workerId,
        admin: req.user.id,
        amount,
        status: "Paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        paidDate: new Date(),
      });

         await Worker.findByIdAndUpdate(workerId, {
        $inc: { revenue: amount },
      });
      const admin = await Admin.findById(req.user.id);


      
    await Notification.create({
      user: workerId,
      message: `You have received a payment of ${amount} from ${admin.companyName} agency.`,
          type: "Payment",
          isRead: false,
        });

      res.redirect("/admin/invoices");
    } else {
      res.status(400).send("Invalid payment signature");
    }
  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).send("Payment verification failed");
  }
};


module.exports = {
  getInvoicesAndPayments,
  createInvoicePage,
  createInvoice,
  getWorkerPayments,
  getNewWorkerPayForm,
  workerShare,
  createWorkerPayOrder,
  verifyWorkerPayment,
};
