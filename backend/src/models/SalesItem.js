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
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    purchase_item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseItem",
    },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SalesItem", salesItemSchema);
