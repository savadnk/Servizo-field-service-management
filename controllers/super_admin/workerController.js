const {  Worker, Admin } = require("../../models/User");

const getWorkers = async (req,res) => {
    try{
        const workers = await Worker.find().populate("admin", "companyName").lean();

        const workerData = await Promise.all( 
            workers.map( async (worker, index) => {
               

                return{
                    shortId: `WK${(index + 1).toString().padStart(3, "0")}`,
                    id:worker._id,
                    name: worker.name,
                    email: worker.email,
                    company: worker.admin?.companyName || "N/A",
                    skills: worker.skills,
                    rating: worker.rating,
                    status: worker.status,

                }
            })
        )
        res.render("superadmin/workers", {
            workers: workerData,
            user: req.user,
             title: "SuperAdmin WorkerManage",
            active: "workerManage",
        })
        

    }catch(error){
        console.log(error);
        res.status(500).render("error", { error: "Failed to load workers"} )
    }
}

const blockWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Worker.findByIdAndUpdate(id, { status: "Blocked" });
    console.log("Updated Worker:", updated);
    res.redirect("/superadmin/workers");
  } catch (error) {
    console.error("Block Worker Error:", error);
    res.status(500).render("error", { error: "Failed to block worker" });
  }
};

const unblockWorker = async (req, res) => {
  try {
    const { id } = req.params;
    await Worker.findByIdAndUpdate(id, { status: "Active" });
    res.redirect("/superadmin/workers");
  } catch (error) {
    console.error("Unblock Worker Error:", error);
    res.status(500).render("error", { error: "Failed to unblock worker" });
  }
};


module.exports = {getWorkers, blockWorker, unblockWorker };
