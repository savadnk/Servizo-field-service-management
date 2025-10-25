const { Customer } = require("../../models/User");
const Job = require("../../models/Job")
const Invoice = require("../../models/Invoice");

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().lean();

    const customerData = await Promise.all(
      customers.map(async (customer, index) => {
        // Count service requests
        const totalRequests = await Job.countDocuments({ customer: customer._id });

        // Total payments made
        const paymentsResult = await Invoice.aggregate([
          { $match: { customer: customer._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalPayments = paymentsResult[0]?.total || 0;

        return {
          shortId: `CU${(index + 1).toString().padStart(3, "0")}`,
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          type: customer.customerType || "Individual",
          status: customer.status ,
          totalRequests,
          totalPayments,
        };
      })
    );

    res.render("superadmin/customers", {
      customers: customerData,
      user: req.user,
      title: "SuperAdmin - Customer Oversight",
      active: "customerManage",
    });
  } catch (error) {
    console.error( error);
    res.status(500).render("error", { error: "Failed to load customers" });
  }
};

const blockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await Customer.findByIdAndUpdate(id, { status: "Blocked" });
    res.redirect("/superadmin/customers");
  } catch (error) {
    console.error("Block Customer Error:", error);
    res.status(500).render("error", { error: "Failed to block customer" });
  }
};

const unblockCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await Customer.findByIdAndUpdate(id, { status: "Active" });
    res.redirect("/superadmin/customers");
  } catch (error) {
    console.error("Unblock Customer Error:", error);
    res.status(500).render("error", { error: "Failed to unblock customer" });
  }
};

module.exports = {
  getCustomers,
  blockCustomer,
  unblockCustomer,
};