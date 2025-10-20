const mongoose = require("mongoose")

const JobAssignmentSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["Assigned", "Accepted", "Paused", "Completed"],
        default: "Assigned"
    },
    assignedAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    completedAt: { type: Date, default: null }
});

const JobAssignment = mongoose.model("JobAssignment", JobAssignmentSchema);

module.exports = JobAssignment;