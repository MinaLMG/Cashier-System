const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    min_stock: { type: Number, default: 0 },
    default_volume: { type: mongoose.Schema.Types.ObjectId, ref: "Volume" },
});

module.exports = mongoose.model("Product", productSchema);
