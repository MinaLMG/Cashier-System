const Expires = require("../models/Expires");

exports.getAllExpires = async (req, res) => {
    try {
        const data = await Expires.find().populate("notification purchaseItem");
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch expiry notifications.",
        });
    }
};

exports.createExpires = async (req, res) => {
    const { notification, purchaseItem } = req.body;
    if (!notification || !purchaseItem) {
        return res
            .status(400)
            .json({ error: "Notification and purchaseItem are required." });
    }

    try {
        const entry = new Expires({ notification, purchaseItem });
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: "Failed to create relation." });
    }
};

exports.deleteExpires = async (req, res) => {
    try {
        const entry = await Expires.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ error: "Entry not found." });
        res.status(200).json({ message: "Entry deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete entry." });
    }
};
