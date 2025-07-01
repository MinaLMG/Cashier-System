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
    barcode: { type: String },
    sale_price: { type: Number, required: true },
});

module.exports = mongoose.model("HasVolume", hasVolumeSchema);
