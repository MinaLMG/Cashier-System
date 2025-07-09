const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
    purchase_invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PurchaseInvoice",
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
    expiry: { type: Date },
    buy_price: { type: Number, required: true },
    walkin_price: { type: Number, required: true },
    pharmacy_price: { type: Number, required: true },
    remaining: { type: Number },
});

purchaseItemSchema.index({ product: 1 });

module.exports = mongoose.model("PurchaseItem", purchaseItemSchema);
