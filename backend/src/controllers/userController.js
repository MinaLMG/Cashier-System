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

exports.updateActiveTemplate = async (req, res) => {
    try {
        const { templateId } = req.body;
        
        console.log("Backend: Update active template to", templateId);
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.activeTemplate = templateId;
        await user.save();
        
        // Return fully populated user so frontend gets the new colors
        await user.populate('activeTemplate');
        
        // Explicitly convert Map to Object for JSON response if Mongoose doesn't do it automatically via toJSON recursion
        // This handles the edge case where populated docs inside toJSON don't trigger their own toJSON transforms
        const userObj = user.toJSON();
        if (user.activeTemplate && user.activeTemplate.preferences instanceof Map) {
            console.log("Backend: Converting Map to Object for response");
            userObj.activeTemplate = user.activeTemplate.toJSON(); // Ensure template's own toJSON is used
        }
        
        console.log("Backend: Updated active template preferences size:", user.activeTemplate?.preferences?.size);

        res.status(200).json(userObj);
    } catch (err) {
        console.error("Template link update error:", err);
        res.status(500).json({ error: "Failed to update active template." });
    }
};
