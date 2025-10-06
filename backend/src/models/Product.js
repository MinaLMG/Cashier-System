const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    min_stock: {
        type: Number,
    },
    conversions: [
        {
            from: {
                type: String,
            },
            to: {
                type: String,
            },
            value: {
                type: Number,
            },
            barcode: {
                type: String,
                default: "",
            },
        },
    ],
    // Unit-based prices (per base unit)
    u_walkin_price: { type: Number, required: true, default: 0 },
    u_pharmacy_price: { type: Number, required: true, default: 0 },
    total_remaining: {
        type: Number,
        default: 0,
    },
});

// Add timestamps to the schema
addTimestamps(productSchema);

module.exports = mongoose.model("Product", productSchema);
