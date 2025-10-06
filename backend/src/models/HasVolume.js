const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");
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

// Ensure barcode uniqueness for non-empty values
hasVolumeSchema.index(
    { barcode: 1 },
    {
        unique: true,
        partialFilterExpression: {
            barcode: { $nin: [null, ""] }, // Only apply uniqueness to non-empty values
        },
    }
);

// Add a compound index for product and volume to ensure uniqueness
hasVolumeSchema.index({ product: 1, volume: 1 }, { unique: true });

// Add timestamps to the schema
addTimestamps(hasVolumeSchema);

module.exports = mongoose.model("HasVolume", hasVolumeSchema);
