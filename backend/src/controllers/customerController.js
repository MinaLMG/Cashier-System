const Customer = require("../models/Customer");

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find();
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch customers." });
    }
};

exports.createCustomer = async (req, res) => {
    const { name, type, phone } = req.body;
    if (!name || !type)
        return res.status(400).json({ error: "Name and type are required." });

    try {
        const customer = new Customer({ name, type, phone });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to create customer." });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer)
            return res.status(404).json({ error: "Customer not found." });
        res.status(200).json({ message: "Customer deleted." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete customer." });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { type, name, phone } = req.body;
        if (!type || !name)
            return res
                .status(400)
                .json({ error: "Type and name are required." });

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { type, name, phone },
            { new: true, runValidators: true }
        );

        if (!customer)
            return res.status(404).json({ error: "Customer not found." });
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to update customer." });
    }
};
