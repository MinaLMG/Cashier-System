const mongoose = require("mongoose");

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

module.exports = mongoose.model("GotMinimum", gotMinimumSchema);
