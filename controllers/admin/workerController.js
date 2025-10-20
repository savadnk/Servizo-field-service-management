const { Worker, Admin } = require("../../models/User");
const bcrypt = require("bcryptjs");
const Notification = require("../../models/Notification")
const JobAssignment = require("../../models/JobAssignment");

const getWorkers = async (req, res) => {
  try {

    const admin = await Admin.findById(req.user.id);
        if (!admin.verified) {
          return res.redirect("/admin/pending");
        }
    // Get filter from query (Available / Offline / All)
    const { filter } = req.query;

    // 1️⃣ Build base query
    const query = { admin: req.user.id };

    if (filter === "Available") {
      query.availability = true;
    } else if (filter === "Offline") {
      query.availability = false;
    }
    // (if filter == 'All' or not provided → show all)

    // 2️⃣ Find workers
    const workers = await Worker.find(query).lean();

    // 3️⃣ Aggregate active job count for each worker
    const activeCounts = await JobAssignment.aggregate([
      { $match: { status: { $in: ["Assigned", "Accepted", "Paused"] } } },
      { $group: { _id: "$worker", count: { $sum: 1 } } },
    ]);

    const activeMap = activeCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.count;
      return acc;
    }, {});

    const workersWithCounts = workers.map((worker) => ({
      ...worker,
      activeJobCount: activeMap[worker._id.toString()] || 0,
    }));

    // 4️⃣ Render page
    res.render("admin/workers", {
      title: "Worker Management",
      user: req.user,
      admin,
      workers: workersWithCounts,
      active: "workerManage",
      filter: filter || "All", // Pass current filter to UI
    });

  } catch (err) {
    console.error("Error fetching workers with job counts:", err);
    res.status(500).render("error", { error: "Failed to load workers" });
  }
};




// ✅ Add New Worker

const addWorker = async (req, res) => {
    try {
        const { name, email, phone, skills } = req.body;
        const existUser = await Worker.findOne({ email })
        if (existUser) {
            return res.status(400).render("admin/workers", { error: "Email already exists", user: req.user })
        }

        // Generate a default password (phone + "123" for example)
        const rawPassword = name + "123";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const worker = new Worker({
            admin: req.user.id,
            name,
            email,
            phone,
            availability: true,
            status: "Active",
            password: hashedPassword,   // ✅ required field
            role: "worker"
        });

        await worker.save();

        await Notification.create({
            user: req.user.id,
            message:  `New worker ${worker.name} registered successfully.`,
            type: "worker"
        });

        res.redirect(`/admin/workers?success=${encodeURIComponent('Created New Worker')}`);
    } catch (err) {
        console.error("Error adding worker:", err);
        res.status(500).render("error", { error: "Failed to add worker" });
    }
};

module.exports = {
    getWorkers,
    addWorker
};
