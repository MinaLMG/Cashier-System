const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");
const gotMinimumSchema = new mongoose.Schema({
    notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
});

// Add timestamps to the schema
addTimestamps(gotMinimumSchema);

module.exports = mongoose.model("GotMinimum", gotMinimumSchema);
