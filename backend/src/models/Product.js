const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    min_stock: { type: Number, default: 0 },
    default_volume: { type: mongoose.Schema.Types.ObjectId, ref: "Volume" },
});

module.exports = mongoose.model("Product", productSchema);
