const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
});

// Add timestamps to the schema
addTimestamps(supplierSchema);

module.exports = mongoose.model("Supplier", supplierSchema);
