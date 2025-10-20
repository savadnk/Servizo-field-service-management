// const WorkerPay = require("../../models/WorkerPay");
// const Job = require("../../models/Job");
// const {  Admin } = require("../../models/User");
// const Notification = require("../../models/Notification");



// const getWorkerPayments = async (req, res) => {
//   const admin = await Admin.findById(req.user.id);
//         if (!admin.verified) {
//           return res.redirect("/admin/pending");
//         }
//   const pays = await WorkerPay.find({ admin: req.user.id })
//     .populate("worker", "name email")
//     .populate("job", "title");
//   res.render("admin/invoices", { pays });
// };

// const payWorker = async (req, res) => {
//   try {
//     const { jobId, workerId, amount } = req.body;
//     const admin = await Admin.findById(req.user.id);
//     console.log(admin);
//     console.log(jobId, workerId, amount);

    

//     await WorkerPay.create({
//       job: jobId,
//       worker: workerId,
//       admin: req.user.id,
//       amount,
//       status: "Paid",
//       paidDate: new Date(),
//     });
    

        

//     res.redirect("/admin/worker-payments");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to pay worker");
//   }
// };

// module.exports = { getWorkerPayments, payWorker };
