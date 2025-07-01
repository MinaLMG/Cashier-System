const mongoose = require("mongoose");

const salesInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
