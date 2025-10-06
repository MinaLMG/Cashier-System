const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const volumeSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

// Add timestamps to the schema
addTimestamps(volumeSchema);

module.exports = mongoose.model("Volume", volumeSchema);
