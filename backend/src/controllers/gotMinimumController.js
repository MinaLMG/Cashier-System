const GotMinimum = require("../models/GotMinimum");

exports.getAllGotMinimums = async (req, res) => {
    try {
        const data = await GotMinimum.find().populate("product notification");
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch minimum stock alerts.",
        });
    }
};

exports.createGotMinimum = async (req, res) => {
    const { product, notification } = req.body;
    if (!product || !notification) {
        return res
            .status(400)
            .json({ error: "Product and notification are required." });
    }

    try {
        const entry = new GotMinimum({ product, notification });
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: "Failed to create entry." });
    }
};

exports.deleteGotMinimum = async (req, res) => {
    try {
        const entry = await GotMinimum.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ error: "Entry not found." });
        res.status(200).json({ message: "Entry deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete entry." });
    }
};
