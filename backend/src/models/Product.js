const mongoose = require("mongoose");

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
    walkin_price: { type: Number, required: true, default: 0 },
    pharmacy_price: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model("Product", productSchema);
