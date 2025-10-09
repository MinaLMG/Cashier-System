const Volume = require("../models/Volume");

exports.getAllVolumes = async (req, res) => {
    try {
        const volumes = await Volume.find();
        res.status(200).json(volumes);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch volumes." });
    }
};
exports.createVolume = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    try {
        const existing = await Volume.findOne({ name });
        if (existing)
            return res.status(409).json({ error: "Volume already exists." });

        const volume = new Volume({ name });
        await volume.save();
        res.status(201).json(volume);
    } catch (err) {
        res.status(500).json({ error: "Failed to create volume." });
    }
};

// Volume deletion functionality disabled
// exports.deleteVolume = async (req, res) => {
//     try {
//         const volume = await Volume.findByIdAndDelete(req.params.id);
//         if (!volume)
//             return res.status(404).json({ error: "Volume not found." });
//         res.status(200).json({ message: "Volume deleted." });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to delete volume." });
//     }
// };
exports.updateVolume = async (req, res) => {
    try {
        const volume = await Volume.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!volume)
            return res.status(404).json({ error: "Volume not found." });
        res.status(200).json(volume);
    } catch (err) {
        res.status(500).json({ error: "Failed to update volume." });
    }
};
