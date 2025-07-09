const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["walkin", "pharmacy"], required: true },
    phone: { type: String },
});

module.exports = mongoose.model("Customer", customerSchema);
