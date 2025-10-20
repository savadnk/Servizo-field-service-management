const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId, 
        ref:"User",
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Address",
        required: true
    },
    serviceType: {type: String, required: true},
    description: {type: String, required: true},
    status: {
        type: String,
        enum: ["Pending", "Assigned","Accepted", "Completed",  "Paused"],
        default: "Pending"
    },
    deadline: {type: Date, required: true},
     
},{
    timestamps: true
})



const Job = mongoose.model("Job", JobSchema);

module.exports = Job;