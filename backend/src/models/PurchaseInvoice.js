const mongoose = require("mongoose");

const purchaseInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
