const Invoice = require("../../models/Invoice");
const Payment = require("../../models/Payment");
const { User } = require("../../models/User");

const getRevenueDashboard = async (req, res) => {
  try {
    // Fetch all paid payments
    const payments = await Payment.find({ status: "Paid" })
    .populate({
            path: "invoice",
            select: "_id createdAt status job",
            populate: { path: "job", select: "serviceType" }, // ✅ get service type
          })   
      .populate("customer", "name")
      .populate("admin", "companyName").lean();

    // Calculate key metrics
    const totalGross = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const platformCommission = payments.reduce((sum, p) => sum + p.platformFee, 0);
    const agencyEarnings = totalGross - platformCommission;

    // Prepare invoice data for the table
    const invoices = payments.map((p) => {
      const fullId = p.invoice?._id?.toString() || "";
      const shortId = fullId ? `INV-${fullId.slice(-5).toUpperCase()}` : "N/A";

      return {
        invoiceId: shortId,
        customer: p.customer?.name || "N/A",
        agency: p.admin?.companyName || "N/A",
        serviceType: p.invoice?.job?.serviceType || "N/A",
        amount: p.totalAmount,
        commission: p.platformFee,
        status: p.status === "Paid" ? "Paid" : "Unpaid",
        date: p.paidAt ? p.paidAt.toLocaleDateString() : "—",
      };
    });

    res.render("superadmin/revenueDashboard", {
      user: req.user,
      title: "Revenue Dashboard",
      active: "platformManage",
      totalGross,
      platformCommission,
      agencyEarnings,
      invoices,
    });
  } catch (err) {
    console.error("Revenue Dashboard Error:", err);
    res.status(500).render("error", { error: "Failed to load revenue dashboard" });
  }
};

module.exports = { getRevenueDashboard };
