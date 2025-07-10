const mongoose = require("mongoose");

const salesInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cost: { type: Number, required: true },
    base: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ["walkin", "pharmacy"], required: true },
    offer: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
