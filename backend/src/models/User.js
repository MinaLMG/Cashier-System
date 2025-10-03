const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    role: {
        type: String,
        enum: ["admin", "seller", "manager"],
        required: true,
        default: "seller",
    },
    hashed_password: {
        type: String,
        required: true,
        minlength: 6,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("hashed_password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.hashed_password = await bcrypt.hash(this.hashed_password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.hashed_password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.hashed_password;
    return user;
};

module.exports = mongoose.model("User", userSchema);
