const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {type: String, required: true},
    type: {
        type: String,
        enum: ["Job", "Invoice","Agency", "Payment", "Worker", "System"],
        default: "System"
    },
    
    isRead: {type: Boolean, default: false}
},{
    timestamps: true
})

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;






















