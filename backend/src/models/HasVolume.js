const mongoose = require("mongoose");

const hasVolumeSchema = new mongoose.Schema({
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
    value: { type: Number, required: true },
    barcode: { type: String, default: null },
    sale_price: { type: Number },
});

hasVolumeSchema.index(
    { barcode: 1 },
    {
        unique: true,
        partialFilterExpression: {
            barcode: { $nin: [null, ""] }, // Only apply uniqueness to non-empty values
        },
    }
);

module.exports = mongoose.model("HasVolume", hasVolumeSchema);
