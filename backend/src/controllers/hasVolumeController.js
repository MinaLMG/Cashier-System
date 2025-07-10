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

// Add this new function to find a product by barcode
exports.findByBarcode = async (req, res) => {
    console.log("entered");
    const { barcode } = req.params;

    if (!barcode) {
        return res.status(400).json({ error: "Barcode is required" });
    }

    try {
        const hasVolume = await HasVolume.findOne({ barcode }).populate(
            "product volume"
        );

        if (!hasVolume) {
            return res
                .status(404)
                .json({ error: "No product found with this barcode" });
        }

        res.status(200).json({
            product: hasVolume.product._id,
            volume: hasVolume.volume._id,
            productName: hasVolume.product.name,
            volumeName: hasVolume.volume.name,
            value: hasVolume.value,
        });
    } catch (err) {
        console.error("Error finding product by barcode:", err);
        res.status(500).json({ error: "Failed to find product by barcode" });
    }
};
