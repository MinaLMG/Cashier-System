const mongoose = require("mongoose");

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

module.exports = mongoose.model("Expires", expiresSchema);
