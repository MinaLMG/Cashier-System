const InvoiceSell = require("../models/InvoiceSell");

exports.getAllInvoiceSells = async (req, res) => {
    try {
        const invoices = await InvoiceSell.find().populate("customer");
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch sell invoices." });
    }
};

exports.createInvoiceSell = async (req, res) => {
    const { date, customer } = req.body;
    if (!date || !customer) {
        return res
            .status(400)
            .json({ error: "Date and customer are required." });
    }

    try {
        const invoice = new InvoiceSell({ date, customer });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to create invoice." });
    }
};

exports.updateInvoiceSell = async (req, res) => {
    try {
        const invoice = await InvoiceSell.findByIdAndUpdate(
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

exports.deleteInvoiceSell = async (req, res) => {
    try {
        const invoice = await InvoiceSell.findByIdAndDelete(req.params.id);
        if (!invoice)
            return res.status(404).json({ error: "Invoice not found." });
        res.status(200).json({ message: "Invoice deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete invoice." });
    }
};
