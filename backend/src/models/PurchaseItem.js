const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");
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
    expiry: { type: Date }, // Optional expiry date
    v_buy_price: { type: Number, required: true }, // Volume buy price
    v_pharmacy_price: { type: Number, required: true }, // Volume pharmacy price
    v_walkin_price: { type: Number, required: true }, // Volume walkin price (was customer/cust price)
    // Guidal price for this volume (treated like other selling prices)
    v_guidal_price: { type: Number, required: true, default: 0 },
    remaining: { type: Number }, // remaining quantity in the volume unit
});

purchaseItemSchema.index({ product: 1 });

// Add timestamps to the schema
addTimestamps(purchaseItemSchema);

module.exports = mongoose.model("PurchaseItem", purchaseItemSchema);
