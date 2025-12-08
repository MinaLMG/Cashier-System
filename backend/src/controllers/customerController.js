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
    const { name, type, phone, address, payment_type } = req.body;

    // Validate required fields
    if (!name || !type)
        return res.status(400).json({ error: "Name and type are required." });

    // Validate customer type
    if (type !== "walkin" && type !== "pharmacy") {
        return res.status(400).json({
            error: "Customer type must be either 'walkin' or 'pharmacy'.",
        });
    }

    // Validate phone number format if provided
    if (phone && !/^[\d\+\-\(\) ]{11}$/.test(phone)) {
        return res.status(400).json({
            error: "Invalid phone number format.",
        });
    }

    // Validate payment type
    if (payment_type && payment_type !== "cash" && payment_type !== "credit") {
        return res.status(400).json({
            error: "Payment type must be either 'cash' or 'credit'.",
        });
    }

    try {
        // Check for duplicate customer name
        const existing = await Customer.findOne({ name });
        if (existing)
            return res
                .status(409)
                .json({ error: "Customer with this name already exists." });

        const customer = new Customer({
            name,
            type,
            phone,
            address,
            payment_type: payment_type || "cash",
        });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to create customer." });
    }
};

// Customer deletion functionality disabled
// exports.deleteCustomer = async (req, res) => {
//     try {
//         const customer = await Customer.findByIdAndDelete(req.params.id);
//         if (!customer)
//             return res.status(404).json({ error: "Customer not found." });
//         res.status(200).json({ message: "Customer deleted." });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to delete customer." });
//     }
// };

exports.updateCustomer = async (req, res) => {
    try {
        const { type, name, phone, address } = req.body;

        // Validate required fields
        if (!type || !name)
            return res
                .status(400)
                .json({ error: "Type and name are required." });

        // Validate customer type
        if (type !== "walkin" && type !== "pharmacy") {
            return res.status(400).json({
                error: "Customer type must be either 'walkin' or 'pharmacy'.",
            });
        }

        // Validate phone number format if provided
        if (phone && !/^[\d\+\-\(\) ]{7,15}$/.test(phone)) {
            return res.status(400).json({
                error: "Invalid phone number format.",
            });
        }

        // Check for duplicate name, excluding current customer
        const duplicate = await Customer.findOne({
            name,
            _id: { $ne: req.params.id },
        });

        if (duplicate) {
            return res.status(409).json({
                error: "Customer with this name already exists.",
            });
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { type, name, phone, address }, // payment_type is intentionally excluded
            { new: true, runValidators: true }
        );

        if (!customer)
            return res.status(404).json({ error: "Customer not found." });
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: "Failed to update customer." });
    }
};
