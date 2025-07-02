const SalesInvoice = require("../models/SalesInvoice");

exports.getAllSalesInvoices = async (req, res) => {
    try {
        const invoices = await SalesInvoice.find();
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sales invoices." });
    }
};

exports.createSalesInvoice = async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required." });

    try {
        const invoice = new SalesInvoice({ date });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to create sales invoice." });
    }
};

exports.updateSalesInvoice = async (req, res) => {
    try {
        const invoice = await SalesInvoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!invoice)
            return res.status(404).json({ error: "Sales invoice not found." });
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to update sales invoice." });
    }
};

exports.deleteSalesInvoice = async (req, res) => {
    try {
        const invoice = await SalesInvoice.findByIdAndDelete(req.params.id);
        if (!invoice)
            return res.status(404).json({ error: "Sales invoice not found." });
        res.status(200).json({ message: "Sales invoice deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete sales invoice." });
    }
};
