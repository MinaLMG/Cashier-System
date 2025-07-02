const HasVolume = require("../models/HasVolume");

exports.getAllHasVolumes = async (req, res) => {
    try {
        const data = await HasVolume.find().populate("product volume");
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch volume-product relations.",
        });
    }
};

exports.createHasVolume = async (req, res) => {
    const { product, volume, value, barcode, sale } = req.body;
    if (!product || !volume || !value) {
        return res
            .status(400)
            .json({ error: "Product, volume, and value are required." });
    }

    try {
        const entry = new HasVolume({ product, volume, value, barcode, sale });
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ error: "Failed to create volume relation." });
    }
};

exports.updateHasVolume = async (req, res) => {
    try {
        const entry = await HasVolume.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!entry) return res.status(404).json({ error: "Entry not found." });
        res.status(200).json(entry);
    } catch (err) {
        res.status(500).json({ error: "Failed to update entry." });
    }
};

exports.deleteHasVolume = async (req, res) => {
    try {
        const entry = await HasVolume.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ error: "Entry not found." });
        res.status(200).json({ message: "Entry deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete entry." });
    }
};
