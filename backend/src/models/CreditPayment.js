const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const creditPaymentSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    value: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "" },
});

// Add timestamps to the schema
addTimestamps(creditPaymentSchema);

module.exports = mongoose.model("CreditPayment", creditPaymentSchema);
