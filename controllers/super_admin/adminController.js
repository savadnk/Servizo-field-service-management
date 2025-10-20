const { Admin, Worker, User } = require("../../models/User");
const Job = require("../../models/Job");
const Invoice = require("../../models/Invoice");

const getAgencies = async (req, res) => {
    try {
        const admins = await Admin.find().lean();

        const agenciesData = await Promise.all(
            admins.map(async (agency, index) => {

                const totalWorkers = await Worker.countDocuments({ admin: agency._id });
                const totalRequests = await Job.countDocuments({ admin: agency._id });

                const revenueResult = await Invoice.aggregate([
                    { $match: { admin: agency._id } },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]);
                const totalRevenue = revenueResult[0]?.total || agency.revenue || 0;

                return {
                    shortId: `AG${(index + 1).toString().padStart(3, "0")}`,
                    id: agency._id,
                    name: agency.name,
                    email: agency.email,
                    companyName: agency.companyName,
                    servicesOffered: agency.servicesOffered,
                    verified: agency.verified || false,
                    status: agency.status || "Pending",
                    totalWorkers,
                    totalRequests,
                    totalRevenue,

                };

            })
        )

        res.render("superadmin/admins", {
            agencies: agenciesData,
            user: req.user,
            title: "SuperAdmin Admin Manage",
            active: "adminManage",
        });

    } catch (error) {
        console.log(error);
        res.status(500).render("error", { error: "Failed to load agencies" });
    }
}

const updateAgencyStatus = async (req, res) => {
    try {
        const { agencyId } = req.params;
        const { status } = req.body;

        const agency = await Admin.findByIdAndUpdate(
            agencyId,
            { status },
            { new: true }
        ).lean();

        if (!agency)
            return res.status(404).render("error", { error: "Agency not found" });

        res.redirect("/superadmin/admins");
    } catch (error) {
        console.error("Update Agency Status Error:", error);
        res.status(500).render("error", { error: "Failed to update agency" });
    }
};

const approveAgency = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.params.id, { verified: true, status: "Active" });
    res.redirect("/superadmin/admins");
  } catch (error) {
    console.error("Approve Agency Error:", error);
    res.status(500).render("error", { message: "Failed to approve agency" });
  }
};

// ✅ Block / Suspend agency
const blockAgency = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.params.id, { status: "Blocked" });
    res.redirect("/superadmin/admins");
  } catch (error) {
    console.error("Block Agency Error:", error);
    res.status(500).render("error", { message: "Failed to block agency" });
  }
};

module.exports = {
    getAgencies,
    updateAgencyStatus,
    approveAgency,
    blockAgency,

};