const SalesItem = require("../models/SalesItem");

exports.getAllSalesItems = async (req, res) => {
    try {
        const items = await SalesItem.find().populate(
            "product invoice customer"
        );
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sales items." });
    }
};

exports.createSalesItem = async (req, res) => {
    const { product, invoice, customer, quantity, price, buying_price, date } =
        req.body;
    if (!product || !invoice || !quantity || !price || !date) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const item = new SalesItem({
            product,
            invoice,
            customer,
            quantity,
            price,
            buying_price,
            date,
        });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ error: "Failed to create sales item." });
    }
};

exports.updateSalesItem = async (req, res) => {
    try {
        const item = await SalesItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!item)
            return res.status(404).json({ error: "Sales item not found." });
        res.status(200).json(item);
    } catch (err) {
        res.status(500).json({ error: "Failed to update sales item." });
    }
};

exports.deleteSalesItem = async (req, res) => {
    try {
        const item = await SalesItem.findByIdAndDelete(req.params.id);
        if (!item)
            return res.status(404).json({ error: "Sales item not found." });
        res.status(200).json({ message: "Sales item deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete sales item." });
    }
};
