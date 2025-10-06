const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const expiresSchema = new mongoose.Schema({
    notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
        required: true,
    },
    purchase_item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseItem",
        required: true,
    },
});

// Add timestamps to the schema
addTimestamps(expiresSchema);

module.exports = mongoose.model("Expires", expiresSchema);
