const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const purchaseInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    total_cost: { type: Number, required: true },
    serial: { type: String, unique: true },
});

// Add timestamps to the schema
addTimestamps(purchaseInvoiceSchema);

module.exports = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
