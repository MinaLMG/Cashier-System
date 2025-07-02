const PurchaseInvoice = require("../models/PurchaseInvoice");

exports.getAllPurchaseInvoices = async (req, res) => {
    try {
        const invoices = await PurchaseInvoice.find();
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch purchase invoices." });
    }
};

exports.createPurchaseInvoice = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required." });

    try {
        const invoice = new PurchaseInvoice({ date });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to create purchase invoice." });
    }
};

exports.updatePurchaseInvoice = async (req, res) => {
    try {
        const invoice = await PurchaseInvoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!invoice)
            return res
                .status(404)
                .json({ error: "Purchase invoice not found." });
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to update purchase invoice." });
    }
};

exports.deletePurchaseInvoice = async (req, res) => {
    try {
        const invoice = await PurchaseInvoice.findByIdAndDelete(req.params.id);
        if (!invoice)
            return res
                .status(404)
                .json({ error: "Purchase invoice not found." });
        res.status(200).json({ message: "Purchase invoice deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete purchase invoice." });
    }
};
