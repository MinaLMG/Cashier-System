const InvoiceBuy = require("../models/InvoiceBuy");

exports.getAllInvoiceBuys = async (req, res) => {
    try {
        const invoices = await InvoiceBuy.find().populate("supplier");
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch buy invoices." });
    }
};

exports.createInvoiceBuy = async (req, res) => {
    const { date, supplier } = req.body;
    if (!date || !supplier) {
        return res
            .status(400)
            .json({ error: "Date and supplier are required." });
    }

    try {
        const invoice = new InvoiceBuy({ date, supplier });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to create invoice." });
    }
};

exports.updateInvoiceBuy = async (req, res) => {
    try {
        const invoice = await InvoiceBuy.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!invoice)
            return res.status(404).json({ error: "Invoice not found." });
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to update invoice." });
    }
};

exports.deleteInvoiceBuy = async (req, res) => {
    try {
        const invoice = await InvoiceBuy.findByIdAndDelete(req.params.id);
        if (!invoice)
            return res.status(404).json({ error: "Invoice not found." });
        res.status(200).json({ message: "Invoice deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete invoice." });
    }
};
