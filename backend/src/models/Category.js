const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
});

// Add timestamps to the schema
addTimestamps(categorySchema);

module.exports = mongoose.model("Category", categorySchema);
