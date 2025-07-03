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
});

module.exports = mongoose.model("Product", productSchema);
