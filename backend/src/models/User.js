const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "seller"], required: true },
    hashed_password: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
