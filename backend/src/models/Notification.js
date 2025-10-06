const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["low_stock", "expiry_warning", "other"],
        required: true,
    },
    date_created: { type: Date, required: true },
    seen: { type: Boolean, default: false },
    message: { type: String },
});

// Add timestamps to the schema
addTimestamps(notificationSchema);

module.exports = mongoose.model("Notification", notificationSchema);
