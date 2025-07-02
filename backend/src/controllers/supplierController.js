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
    if (!name) return res.status(400).json({ error: "Name is required." });

    try {
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
    try {
        const { name, phone } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required." });

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
