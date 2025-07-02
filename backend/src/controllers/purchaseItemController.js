const PurchaseItem = require("../models/PurchaseItem");

exports.getAllPurchaseItems = async (req, res) => {
    try {
        const items = await PurchaseItem.find().populate(
            "product invoice supplier"
        );
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch purchase items." });
    }
};

exports.createPurchaseItem = async (req, res) => {
    const {
        product,
        invoice,
        supplier,
        quantity,
        buying_price,
        walkin_price,
        pharmacy_price,
        expiry,
        rest,
    } = req.body;
    if (!product || !invoice || !quantity || !buying_price) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const item = new PurchaseItem({
            product,
            invoice,
            supplier,
            quantity,
            buying_price,
            walkin_price,
            pharmacy_price,
            expiry,
            rest,
        });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: "Failed to create purchase item." });
    }
};

exports.updatePurchaseItem = async (req, res) => {
    try {
        const item = await PurchaseItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!item)
            return res.status(404).json({ error: "Purchase item not found." });
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: "Failed to update purchase item." });
    }
};

exports.deletePurchaseItem = async (req, res) => {
    try {
        const item = await PurchaseItem.findByIdAndDelete(req.params.id);
        if (!item)
            return res.status(404).json({ error: "Purchase item not found." });
        res.status(200).json({ message: "Purchase item deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete purchase item." });
    }
};
