const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["walkin", "pharmacy"], required: true },
    phone: { type: String },
});

// Add timestamps to the schema
addTimestamps(customerSchema);

module.exports = mongoose.model("Customer", customerSchema);
