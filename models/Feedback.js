const mongoose = require("mongoose")

const FeedbackSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
  
    rating: {type: Number, min: 1, max: 5, required: true},
      
},{
    timestamps: true
})

const Feedback = mongoose.model("Feedback", FeedbackSchema)

module.exports = Feedback;