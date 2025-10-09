const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const returnItemSchema = new mongoose.Schema({
    return_invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReturnInvoice",
        required: true,
    },
    sales_item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesItem",
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
    quantity: { type: Number, required: true }, // quantity returned (in volume unit)
    v_price: { type: Number, required: true }, // volume unit price at return
    sources: [
        {
            purchase_item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PurchaseItem",
                required: true,
            },
            quantity: { type: Number, required: true }, // quantity returned to this source (in base units)
        },
    ],
    returned_to_sources: [
        {
            purchase_item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PurchaseItem",
                required: true,
            },
            quantity: { type: Number, required: true }, // quantity returned to this source (in base units)
            revenue_loss: { type: Number, required: true }, // revenue loss for this source
            purchase_price: { type: Number, required: true }, // purchase price at source
            selling_price: { type: Number, required: true }, // selling price
        },
    ],
    total_revenue_loss: { type: Number, default: 0 }, // total revenue loss from this return
    date: { type: Date },
});

// Add timestamps to the schema
addTimestamps(returnItemSchema);

module.exports = mongoose.model("ReturnItem", returnItemSchema);
