//  Admin(Agency) Management 
//  .View Agency Profile: workers, customers under that agency, service requests.
// 2️⃣ View single agency profile
const getAgencyProfile = async (req, res) => {
  try {
    const { agencyId } = req.params;

    const agency = await Admin.findById(agencyId).lean();
    if (!agency) return res.status(404).render("error", { error: "Agency not found", layout: false });

    const workers = await Worker.find({ _id: { $in: agency._id } }).lean();
    const jobs = await Job.find({ admin: agency._id }).populate("customer").lean();

    const customersSet = new Set(jobs.map(job => job.customer._id.toString()));
    const customers = await User.find({ _id: { $in: Array.from(customersSet) } }).lean();

    res.render("superadmin/agencyProfile", {
      agency,
      workers,
      jobs,
      customers
    });

  } catch (error) {
    console.error("Get Agency Profile Error:", error);
    res.status(500).render("error", { error: "Failed to load agency profile", layout: false });
  }
};

const getAgessncyProfile = async (req, res) => {
  try {
    const { agencyId } = req.params;

    const agency = await Admin.findById(agencyId).lean();
    if (!agency)
      return res.status(404).render("error", { error: "Agency not found", layout: false });

    const workers = await Worker.find({ admin: agencyId }).lean();
    const jobs = await Job.find({ admin: agencyId })
      .populate("customer")
      .lean();

    const customers = jobs.map((job) => job.customer);

    res.render("superadmin/agencyProfile", {
      agency,
      workers,
      jobs,
      customers,
    });
  } catch (error) {
    console.error("Get Agency Profile Error:", error);
    res.status(500).render("error", { error: "Failed to load agency profile", layout: false });
  }
};

//// ✅ Suspend/Block Worker in worker
const blockWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    await Worker.findByIdAndUpdate(workerId, { status: "Blocked" });

    res.redirect("/superadmin/workers");
  } catch (error) {
    console.error("Block Worker Error:", error);
    res.status(500).render("error", { error: "Failed to block worker", layout: false });
  }
};