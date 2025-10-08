const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const purchaseInvoiceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        validate: {
            validator: function (date) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const invoiceDate = new Date(date);
                invoiceDate.setHours(0, 0, 0, 0);
                return invoiceDate <= today;
            },
            message: "تاريخ الفاتورة لا يمكن أن يكون في المستقبل",
        },
    },
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
