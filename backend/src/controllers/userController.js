const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users." });
    }
};

exports.createUser = async (req, res) => {
    const { name, role, hashed_password } = req.body;
    if (!name || !role || !hashed_password)
        return res
            .status(400)
            .json({ error: "Name, role and password are required." });

    try {
        const user = new User({ name, role, hashed_password });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to create user." });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found." });
        res.status(200).json({ message: "User deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user." });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, role, password } = req.body;
        if (!name || !role || !password)
            return res.status(400).json({ error: "All fields are required." });

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, role, password },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ error: "User not found." });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to update user." });
    }
};
