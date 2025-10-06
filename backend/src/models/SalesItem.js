const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

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
    v_price: { type: Number, required: true }, // volume unit price at sale (renamed from price)
    sources: [
        {
            purchase_item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PurchaseItem",
                required: true,
            },
            quantity: { type: Number, required: true }, // quantity taken from this purchase item in the volume unit
        },
    ],
    date: { type: Date, default: Date.now },
});

// Add timestamps to the schema
addTimestamps(salesItemSchema);

module.exports = mongoose.model("SalesItem", salesItemSchema);
