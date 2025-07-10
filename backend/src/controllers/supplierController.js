const Supplier = require("../models/Supplier");

exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch suppliers." });
    }
};

exports.createSupplier = async (req, res) => {
    const { name, phone } = req.body;

    // Validate required fields
    if (!name) return res.status(400).json({ error: "Name is required." });

    // Validate phone number format if provided
    if (phone && !/^[\d\+\-\(\) ]{11}$/.test(phone)) {
        return res.status(400).json({
            error: "Invalid phone number format.",
        });
    }

    try {
        // Check for duplicate supplier name
        const existing = await Supplier.findOne({ name });
        if (existing)
            return res
                .status(409)
                .json({ error: "Supplier with this name already exists." });

        const supplier = new Supplier({ name, phone });
        await supplier.save();
        res.status(201).json(supplier);
    } catch (err) {
        res.status(500).json({ error: "Failed to create supplier." });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier)
            return res.status(404).json({ error: "Supplier not found." });
        res.status(200).json({ message: "Supplier deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete supplier." });
    }
};

exports.updateSupplier = async (req, res) => {
    const { name, phone } = req.body;

    // Validate required fields
    if (!name) return res.status(400).json({ error: "Name is required." });

    // Validate phone number format if provided
    if (phone && !/^[\d\+\-\(\) ]{7,15}$/.test(phone)) {
        return res.status(400).json({
            error: "Invalid phone number format.",
        });
    }

    try {
        // Check for duplicate name, excluding current supplier
        const duplicate = await Supplier.findOne({
            name,
            _id: { $ne: req.params.id },
        });

        if (duplicate) {
            return res.status(409).json({
                error: "Supplier with this name already exists.",
            });
        }

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { name, phone },
            { new: true, runValidators: true }
        );

        if (!supplier)
            return res.status(404).json({ error: "Supplier not found." });

        res.status(200).json(supplier);
    } catch (err) {
        res.status(500).json({ error: "Failed to update supplier." });
    }
};
