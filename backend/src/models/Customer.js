const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["walkin", "pharmacy"], required: true },
    payment_type: { 
        type: String, 
        enum: ["cash", "credit"], 
        required: true, 
        default: "cash" 
    },
    phone: { type: String },
});

// Add timestamps to the schema
addTimestamps(customerSchema);

module.exports = mongoose.model("Customer", customerSchema);
