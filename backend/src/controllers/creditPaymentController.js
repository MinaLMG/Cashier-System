const CreditPayment = require("../models/CreditPayment");
const Customer = require("../models/Customer");

exports.createCreditPayment = async (req, res) => {
    try {
        const { customer, value, date, notes } = req.body;

        if (!customer || !value || !date) {
            return res.status(400).json({ error: "بيانات ناقصة" });
        }

        const customerExists = await Customer.findById(customer);
        if (!customerExists) {
            return res.status(404).json({ error: "العميل غير موجود" });
        }

        if (customerExists.payment_type !== "credit") {
            return res.status(400).json({ error: "هذا العميل ليس آجل" });
        }

        const payment = await CreditPayment.create({
            customer,
            value,
            date,
            notes,
        });

        res.status(201).json(payment);
    } catch (err) {
        console.error("Error creating credit payment:", err);
        res.status(500).json({ error: "فشل في حفظ الدفع" });
    }
};

exports.updateCreditPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { value, date, notes } = req.body;

        const payment = await CreditPayment.findByIdAndUpdate(
            id,
            { value, date, notes },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ error: "الدفع غير موجود" });
        }

        res.status(200).json(payment);
    } catch (err) {
        console.error("Error updating credit payment:", err);
        res.status(500).json({ error: "فشل في تحديث الدفع" });
    }
};

exports.deleteCreditPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await CreditPayment.findByIdAndDelete(id);

        if (!payment) {
            return res.status(404).json({ error: "الدفع غير موجود" });
        }

        res.status(200).json({ message: "تم حذف الدفع بنجاح" });
    } catch (err) {
        console.error("Error deleting credit payment:", err);
        res.status(500).json({ error: "فشل في حذف الدفع" });
    }
};

exports.getPaymentsByCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const payments = await CreditPayment.find({ customer: customerId }).sort({
            date: -1,
        });
        res.status(200).json(payments);
    } catch (err) {
        console.error("Error fetching credit payments:", err);
        res.status(500).json({ error: "فشل في جلب الدفعات" });
    }
};

exports.getAllCreditPayments = async (req, res) => {
    try {
        const { limit } = req.query;
        const payments = await CreditPayment.find()
            .sort({ date: -1 })
            .limit(Number(limit) || 500)
            .populate("customer", "name");
        res.status(200).json(payments);
    } catch (err) {
        console.error("Error fetching all credit payments:", err);
        res.status(500).json({ error: "فشل في جلب الدفعات" });
    }
};
