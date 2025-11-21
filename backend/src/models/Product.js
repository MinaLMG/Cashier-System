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
    // Guidal price per base unit (behaves like other selling prices)
    u_guidal_price: { type: Number, required: true, default: 0 },
    // Suggested unit prices based on moving average
    u_suggested_buy_price: { type: Number, default: null },
    u_suggested_pharmacy_price: { type: Number, default: null },
    u_suggested_walkin_price: { type: Number, default: null },
    u_suggested_guidal_price: { type: Number, default: null },
    // Track when suggestions were last updated
    suggestions_updated_at: { type: Date, default: null },
    total_remaining: {
        type: Number,
        default: 0,
    },
    low_stock_created: {
        type: Boolean,
        default: false,
    },
});

// Add timestamps to the schema
addTimestamps(productSchema);

module.exports = mongoose.model("Product", productSchema);
