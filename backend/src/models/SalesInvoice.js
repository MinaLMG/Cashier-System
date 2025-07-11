const mongoose = require("mongoose");

const salesInvoiceSchema = new mongoose.Schema({
    date: { type: Date, required: true }, // This will store both date and time
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    total_selling_price: { type: Number, required: true }, // Total selling price before discount
    final_amount: { type: Number, required: true }, // Final amount after discount (new field)
    total_purchase_cost: { type: Number, required: true, default: 0 }, // Total purchase cost
    type: { type: String, enum: ["walkin", "pharmacy"], required: true },
    offer: { type: Number, required: true, default: 0 }, // Discount amount
    serial: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
