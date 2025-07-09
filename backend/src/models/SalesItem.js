const mongoose = require("mongoose");

const salesItemSchema = new mongoose.Schema({
    sales_invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesInvoice",
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    volume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Volume",
        required: true,
    },
    quantity: { type: Number, required: true }, // total quantity sold (in selected volume unit)
    price: { type: Number, required: true }, // unit price at sale
    sources: [
        {
            purchase_item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PurchaseItem",
                required: true,
            },
            quantity: { type: Number, required: true }, // quantity taken from this purchase item
        },
    ],
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SalesItem", salesItemSchema);
