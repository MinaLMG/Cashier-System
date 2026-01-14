const mongoose = require("mongoose");
const { addTimestamps } = require("../utils/timestamps");

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    preferences: {
        type: Map,
        of: String,
        required: true
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
});

addTimestamps(templateSchema);

// Ensure name is unique
templateSchema.index({ name: 1 }, { unique: true });

// Convert Map to Object for JSON output
templateSchema.methods.toJSON = function () {
    const template = this.toObject({ getters: true, virtuals: true });
    if (template.preferences instanceof Map) {
        template.preferences = Object.fromEntries(template.preferences);
    }
    return template;
};

module.exports = mongoose.model("Template", templateSchema);
