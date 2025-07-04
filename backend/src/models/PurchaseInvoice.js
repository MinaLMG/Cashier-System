const mongoose = require("mongoose");

const purchaseInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cost: { type: Number, required: true },
});

module.exports = mongoose.model("PurchaseInvoice", purchaseInvoiceSchema);
