const mongoose = require("mongoose");

// Common timestamps schema
const timestampsSchema = {
    created_at: {
        type: Date,
        default: Date.now,
        required: true,
    },
    updated_at: {
        type: Date,
        default: Date.now,
        required: true,
    },
};

// Function to add timestamps to any schema
const addTimestamps = (schema) => {
    // Add timestamps fields to schema
    schema.add(timestampsSchema);

    // Pre-save middleware to update timestamps
    schema.pre("save", function (next) {
        this.updated_at = new Date();
        next();
    });

    // Pre-update middleware for findOneAndUpdate, updateOne, updateMany
    schema.pre(
        ["findOneAndUpdate", "updateOne", "updateMany"],
        function (next) {
            this.set({ updated_at: new Date() });
            next();
        }
    );

    // Pre-update middleware for update
    schema.pre("update", function (next) {
        this.set({ updated_at: new Date() });
        next();
    });

    return schema;
};

// Function to create a schema with timestamps
const createSchemaWithTimestamps = (definition, options = {}) => {
    const schema = new mongoose.Schema(definition, options);
    return addTimestamps(schema);
};

module.exports = {
    timestampsSchema,
    addTimestamps,
    createSchemaWithTimestamps,
};
