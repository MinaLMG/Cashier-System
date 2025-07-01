const mongoose = require("mongoose");

const volumeSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

module.exports = mongoose.model("Volume", volumeSchema);
