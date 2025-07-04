const PurchaseInvoice = require("../models/PurchaseInvoice");
const PurchaseItem = require("../models/PurchaseItem");

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

exports.createFullPurchaseInvoice = async (req, res) => {
    const { date, supplier, rows, cost } = req.body;

    if (!date || !rows?.length || typeof cost !== "number" || cost <= 0) {
        const missing = [];
        if (!date) missing.push("تاريخ الفاتورة");
        if (!rows?.length) missing.push("عناصر الفاتورة");
        if (typeof cost !== "number" || cost <= 0)
            missing.push("إجمالى الفاتورة");

        return res.status(400).json({
            error: "بيانات ناقصة",
            details: `يرجى إدخال: ${missing.join("، ")}`,
        });
    }

    let newInvoice = null;
    let createdItems = [];

    try {
        // Step 1: Filter valid rows
        const validRows = rows.filter(
            (r) =>
                r.product &&
                r.volume &&
                r.quantity &&
                r.buy_price &&
                r.phar_price &&
                r.cust_price &&
                !isNaN(Number(r.quantity)) &&
                !isNaN(Number(r.buy_price)) &&
                !isNaN(Number(r.phar_price)) &&
                !isNaN(Number(r.cust_price))
        );

        if (validRows.length === 0) {
            return res.status(400).json({
                error: "كل الصفوف تحتوي على أخطاء ولا يمكن حفظ الفاتورة",
            });
        }

        // ✅ Step 2: Calculate total cost

        const recalculatedCost = validRows.reduce((sum, r) => {
            const quantity = Number(r.quantity);
            const buyPrice = Number(r.buy_price);
            return sum + quantity * buyPrice;
        }, 0);

        // ✅ Step 3: Create invoice with cost
        newInvoice = await PurchaseInvoice.create({
            date,
            supplier: supplier || null,
            user: req.user?._id || null,
            cost: recalculatedCost,
        });

        // ✅ Step 4: Create items
        const items = validRows.map((r) => ({
            purchase_invoice: newInvoice._id,
            product: r.product,
            volume: r.volume,
            quantity: Number(r.quantity),
            buy_price: Number(r.buy_price),
            pharmacy_price: Number(r.phar_price),
            walkin_price: Number(r.cust_price),
            expiry: r.expiry ? new Date(r.expiry) : null,
            remaining_quantity: r.remaining
                ? Number(r.remaining)
                : Number(r.quantity),
        }));

        createdItems = await PurchaseItem.insertMany(items);

        return res.status(201).json({
            message: "تم حفظ الفاتورة بنجاح",
            invoice: newInvoice,
            items: createdItems,
        });
    } catch (err) {
        console.error("خطأ في حفظ الفاتورة:", err);

        // rollback
        try {
            if (createdItems.length > 0) {
                await PurchaseItem.deleteMany({
                    _id: { $in: createdItems.map((i) => i._id) },
                });
            }
            if (newInvoice?._id) {
                await PurchaseInvoice.findByIdAndDelete(newInvoice._id);
            }
        } catch (rollbackErr) {
            console.error("خطأ أثناء التراجع عن التغييرات:", rollbackErr);
        }

        // error messages
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "بيانات غير صالحة",
                details: Object.values(err.errors)
                    .map((e) => e.message)
                    .join(". "),
            });
        }

        if (err.name === "CastError") {
            return res.status(400).json({
                error: "معرّف غير صالح",
                details: `الحقل ${err.path}: ${err.value}`,
            });
        }

        if (err.code === 11000) {
            return res.status(409).json({
                error: "هذه الفاتورة موجودة مسبقاً",
            });
        }

        return res.status(500).json({
            error: "حدث خطأ غير متوقع أثناء حفظ الفاتورة",
            details: "يرجى مراجعة البيانات والمحاولة مرة أخرى",
        });
    }
};

exports.getFullPurchaseInvoiceById = async (req, res) => {
    try {
        const invoice = await PurchaseInvoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ error: "الفاتورة غير موجودة" });
        }

        const items = await PurchaseItem.find({
            purchase_invoice: invoice._id,
        });

        const rows = items.map((item) => ({
            product: item.product.toString(),
            quantity: item.quantity.toString(),
            volume: item.volume.toString(),
            buy_price: item.buy_price.toString(),
            phar_price: item.pharmacy_price.toString(),
            cust_price: item.walkin_price.toString(),
            expiry: item.expiry ? item.expiry.toISOString().split("T")[0] : "",
            remaining: item.remaining_quantity?.toString() || "",
        }));

        res.status(200).json({
            date: invoice.date.toISOString().split("T")[0],
            supplier: invoice.supplier || null,
            rows,
            cost: invoice.cost,
        });
    } catch (err) {
        console.error("getFullPurchaseInvoiceById error:", err);
        res.status(500).json({ error: "فشل في تحميل الفاتورة" });
    }
};

exports.getAllFullPurchaseInvoices = async (req, res) => {
    try {
        const invoices = await PurchaseInvoice.find();

        const fullInvoices = await Promise.all(
            invoices.map(async (invoice) => {
                const items = await PurchaseItem.find({
                    purchase_invoice: invoice._id,
                });

                const rows = items.map((item) => ({
                    product: item.product.toString(),
                    quantity: item.quantity.toString(),
                    volume: item.volume.toString(),
                    buy_price: item.buy_price.toString(),
                    phar_price: item.pharmacy_price.toString(),
                    cust_price: item.walkin_price.toString(),
                    expiry: item.expiry
                        ? item.expiry.toISOString().split("T")[0]
                        : "",
                    remaining: item.remaining_quantity?.toString() || "",
                }));

                return {
                    date: invoice.date.toISOString().split("T")[0],
                    supplier: invoice.supplier || null,
                    rows,
                    cost: invoice.cost,
                };
            })
        );

        res.status(200).json(fullInvoices);
    } catch (err) {
        console.error("getAllFullPurchaseInvoices error:", err);
        res.status(500).json({ error: "فشل في تحميل الفواتير" });
    }
};
