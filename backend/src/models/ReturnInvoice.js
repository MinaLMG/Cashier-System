const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const returnInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    sales_invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesInvoice",
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: {
        type: String,
        enum: [
            "defective",
            "wrong_product",
            "customer_request",
            "expired",
            "other",
        ],
        default: "customer_request",
    },
    total_return_amount: { type: Number, required: true }, // Total amount being returned
    total_loss: { type: Number, required: true, default: 0 }, // Total revenue loss from this return
    serial: { type: String, unique: true },
    notes: { type: String },
});

// Add timestamps to the schema
addTimestamps(returnInvoiceSchema);

module.exports = mongoose.model("ReturnInvoice", returnInvoiceSchema);
