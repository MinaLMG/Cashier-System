const PurchaseInvoice = require("../models/PurchaseInvoice");
const PurchaseItem = require("../models/PurchaseItem");
const HasVolume = require("../models/HasVolume");
const Product = require("../models/Product");
const Volume = require("../models/Volume");
const Supplier = require("../models/Supplier");

const updateProductPrices = require("../helpers/productPricing");
const updateProductRemaining = require("../helpers/updateProductRemaining");

// Helper function to generate serial number
const generatePurchaseInvoiceSerial = async (date) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split("T")[0].replace(/-/g, "");
    const timeStr = dateObj
        .toTimeString()
        .split(" ")[0]
        .replace(/:/g, "")
        .substring(0, 4);

    // Base serial format: YYYYMMDD-HHMM-
    const baseSerial = `${dateStr}-${timeStr}-`;

    // Find the highest existing serial with this prefix
    const latestInvoice = await PurchaseInvoice.findOne(
        { serial: new RegExp(`^${baseSerial}`) },
        { serial: 1 },
        { sort: { serial: -1 } }
    );

    let counter = 1;
    if (latestInvoice && latestInvoice.serial) {
        const parts = latestInvoice.serial.split("-");
        if (parts.length === 3) {
            counter = parseInt(parts[2], 10) + 1 || 1;
        }
    }

    return `${baseSerial}${counter}`;
};

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
    const { date, supplier, rows, total_cost } = req.body; // Was 'cost'

    // Basic validation
    if (
        !date ||
        !rows?.length ||
        typeof total_cost !== "number" ||
        total_cost <= 0
    ) {
        // Was 'cost'
        const missing = [];
        if (!date) missing.push("تاريخ الفاتورة");
        if (!rows?.length) missing.push("عناصر الفاتورة");
        if (typeof total_cost !== "number" || total_cost <= 0)
            // Was 'cost'
            missing.push("إجمالى الفاتورة");

        return res.status(400).json({
            error: "بيانات ناقصة",
            details: `يرجى إدخال: ${missing.join("، ")}`,
        });
    }

    // Validate date format
    if (isNaN(new Date(date).getTime())) {
        return res.status(400).json({
            error: "تاريخ الفاتورة غير صالح",
        });
    }

    // Validate supplier if provided
    if (supplier) {
        try {
            const supplierExists = await Supplier.findById(supplier);
            if (!supplierExists) {
                return res.status(400).json({
                    error: "المورد غير موجود",
                });
            }
        } catch (err) {
            return res.status(400).json({
                error: "معرف المورد غير صالح",
            });
        }
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
                r.v_buy_price &&
                r.v_pharmacy_price &&
                r.v_walkin_price &&
                !isNaN(Number(r.quantity)) &&
                !isNaN(Number(r.v_buy_price)) &&
                !isNaN(Number(r.v_pharmacy_price)) &&
                !isNaN(Number(r.v_walkin_price))
        );

        if (validRows.length === 0) {
            return res.status(400).json({
                error: "كل الصفوف تحتوي على أخطاء ولا يمكن حفظ الفاتورة",
            });
        }

        // Validate products and volumes exist
        for (const row of validRows) {
            try {
                const productExists = await Product.findById(row.product);
                if (!productExists) {
                    return res.status(400).json({
                        error: `المنتج غير موجود: ${row.product}`,
                    });
                }
                const volumeExists = await Volume.findById(row.volume);
                if (!volumeExists) {
                    return res.status(400).json({
                        error: `العبوة غير موجودة: ${row.volume}`,
                    });
                }

                // Validate expiry date if provided
                if (row.expiry) {
                    const expiryDate = new Date(row.expiry);
                    if (isNaN(expiryDate.getTime())) {
                        return res.status(400).json({
                            error: "تاريخ انتهاء الصلاحية غير صالح",
                        });
                    }

                    // Optional: Check if expiry date is in the future
                    if (expiryDate < new Date()) {
                        return res.status(400).json({
                            error: "تاريخ انتهاء الصلاحية يجب أن يكون في المستقبل",
                        });
                    }
                }
            } catch (err) {
                return res.status(400).json({
                    error: "معرف منتج أو عبوة غير صالح",
                });
            }
        }

        // ✅ Step 2: Calculate total cost
        const recalculatedCost = validRows.reduce((sum, r) => {
            const quantity = Number(r.quantity);
            const buyPrice = Number(r.v_buy_price);
            return sum + quantity * buyPrice;
        }, 0);

        // Generate serial number
        const serial = await generatePurchaseInvoiceSerial(date);

        // ✅ Step 3: Create invoice with total_cost and serial
        newInvoice = await PurchaseInvoice.create({
            date,
            supplier: supplier || null,
            user: req.user?._id || null,
            total_cost: recalculatedCost, // Was 'cost'
            createdAt: new Date(),
            serial,
        });

        // ✅ Step 4: Create items
        const items = await Promise.all(
            validRows.map(async (r) => {
                const hasVolume = await HasVolume.findOne({
                    product: r.product,
                    volume: r.volume,
                });

                const remaining_quantity = Number(r.quantity) * hasVolume.value;

                return {
                    purchase_invoice: newInvoice._id,
                    product: r.product,
                    volume: r.volume,
                    quantity: Number(r.quantity),
                    v_buy_price: Number(r.v_buy_price),
                    v_pharmacy_price: Number(r.v_pharmacy_price),
                    v_walkin_price: Number(r.v_walkin_price),
                    expiry: r.expiry ? new Date(r.expiry) : null,
                    remaining: remaining_quantity,
                };
            })
        );

        createdItems = await PurchaseItem.insertMany(items);

        for (const item of createdItems) {
            await updateProductPrices(item.product);
            await updateProductRemaining(item.product);
        }

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
                error: "هذه الفاتورة موجودة مسبق",
            });
        }

        return res.status(500).json({
            error: "حدث خطأ غير متوقع أثناء حفظ الفاتورة",
            details: "يرجى مراجعة البيانات والمحاولة مرة أخرى",
        });
    }
};

exports.updateFullPurchaseInvoice = async (req, res) => {
    const invoiceId = req.params.id;
    const { date, supplier, rows } = req.body;

    // Step 1: Validate request
    if (!date || !rows?.length) {
        const missing = [];
        if (!date) missing.push("تاريخ الفاتورة");
        if (!rows?.length) missing.push("عناصر الفاتورة");

        return res.status(400).json({
            error: "بيانات ناقصة",
            details: `يرجى إدخال: ${missing.join("، ")}`,
        });
    }

    // Step 2: Filter valid rows
    const validRows = rows.filter(
        (r) =>
            r.product &&
            r.volume &&
            r.quantity &&
            r.v_buy_price &&
            r.v_pharmacy_price &&
            r.v_walkin_price &&
            !isNaN(Number(r.quantity)) &&
            !isNaN(Number(r.v_buy_price)) &&
            !isNaN(Number(r.v_pharmacy_price)) &&
            !isNaN(Number(r.v_walkin_price))
    );

    if (validRows.length === 0) {
        return res.status(400).json({
            error: "كل الصفوف تحتوي على أخطاء ولا يمكن حفظ التعديل",
        });
    }

    let oldInvoice = null;
    let oldItems = [];

    try {
        // Step 3: Backup current state
        oldInvoice = await PurchaseInvoice.findById(invoiceId);
        if (!oldInvoice)
            return res.status(404).json({ error: "الفاتورة غير موجودة" });

        oldItems = await PurchaseItem.find({ purchase_invoice: invoiceId });
        // Step X: Recalculate total_cost from valid rows (in both create and update)
        const recalculatedCost = validRows.reduce((sum, r) => {
            const quantity = Number(r.quantity);
            const buyPrice = Number(r.v_buy_price);
            return sum + quantity * buyPrice;
        }, 0);
        // Step 4: Update invoice main fields
        await PurchaseInvoice.findByIdAndUpdate(
            invoiceId,
            {
                date,
                supplier: supplier || null,
                total_cost: recalculatedCost, // Was 'cost'
            },
            { runValidators: true }
        );

        const incomingItemMap = new Map();
        const itemsToInsert = [];
        const updatedItemOps = [];

        for (const r of validRows) {
            if (r._id) {
                // Existing item: modify fields
                incomingItemMap.set(r._id, r);
            } else {
                const hasVolume = await HasVolume.findOne({
                    product: r.product,
                    volume: r.volume,
                });
                const remaining_quantity = Number(r.quantity) * hasVolume.value;
                // New item: insert
                itemsToInsert.push({
                    purchase_invoice: invoiceId,
                    product: r.product,
                    volume: r.volume,
                    quantity: Number(r.quantity),
                    v_buy_price: Number(r.v_buy_price),
                    v_pharmacy_price: Number(r.v_pharmacy_price),
                    v_walkin_price: Number(r.v_walkin_price),
                    expiry: r.expiry ? new Date(r.expiry) : null,
                    remaining: remaining_quantity,
                });
            }
        }

        // Step 5: Modify or remove existing items
        const updatedIds = new Set();

        for (const item of oldItems) {
            const incoming = incomingItemMap.get(item._id.toString());

            if (incoming) {
                // Ensure product/volume don't change
                if (
                    item.product.toString() !== incoming.product ||
                    item.volume.toString() !== incoming.volume
                ) {
                    return res.status(400).json({
                        error: "لا يمكن تعديل المنتج أو العبوة لعنصر تم حفظه بالفعل",
                    });
                }

                // Modify fields
                item.quantity = Number(incoming.quantity);
                item.v_buy_price = Number(incoming.v_buy_price);
                item.v_pharmacy_price = Number(incoming.v_pharmacy_price);
                item.v_walkin_price = Number(incoming.v_walkin_price);
                item.expiry = incoming.expiry
                    ? new Date(incoming.expiry)
                    : null;
                item.remaining = incoming.remaining;
                await item.save();
                updatedIds.add(item._id.toString());
            } else {
                // Item removed by user
                await PurchaseItem.findByIdAndDelete(item._id);
            }
        }

        // Step 6: Insert new items
        let insertedItems = await PurchaseItem.insertMany(itemsToInsert);
        const allAffectedProductIds = new Set([
            ...itemsToInsert.map((i) => i.product.toString()),
            ...oldItems.map((i) => i.product.toString()),
        ]);

        for (const productId of allAffectedProductIds) {
            await updateProductPrices(productId);
            await updateProductRemaining(productId);
        }

        return res.status(200).json({
            message: "تم تعديل الفاتورة بنجاح",
            invoice: oldInvoice,
            inserted: insertedItems,
        });
    } catch (err) {
        console.error("خطأ أثناء تعديل الفاتورة:", err);

        // rollback attempt
        try {
            if (oldInvoiceData) {
                await PurchaseInvoice.findByIdAndUpdate(
                    invoiceId,
                    oldInvoiceData
                );
            }

            // Restore deleted items
            const restoreOps = oldItems.map((i) => ({
                updateOne: {
                    filter: { _id: i._id },
                    update: { $set: i.toObject() },
                    upsert: true,
                },
            }));
            // First delete new items
            if (insertedItems.length > 0) {
                await PurchaseItem.deleteMany({
                    _id: { $in: insertedItems.map((i) => i._id) },
                });
            }

            // Then restore old items
            if (restoreOps.length > 0) {
                await PurchaseItem.bulkWrite(restoreOps);
            }
        } catch (rollbackErr) {
            console.error("❌ فشل التراجع:", rollbackErr);
        }

        return res.status(500).json({
            error: "فشل في تعديل الفاتورة. يرجى المحاولة مرة أخرى.",
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
            _id: item._id,
            product: item.product.toString(),
            quantity: item.quantity.toString(),
            volume: item.volume.toString(),
            v_buy_price: item.v_buy_price.toString(),
            v_pharmacy_price: item.v_pharmacy_price.toString(),
            v_walkin_price: item.v_walkin_price.toString(),
            expiry: item.expiry ? item.expiry.toISOString().split("T")[0] : "",
            remaining: item.remaining?.toString() || "",
        }));

        res.status(200).json({
            _id: req.params.id,
            date: invoice.date.toISOString().split("T")[0],
            supplier: invoice.supplier || null,
            rows,
            total_cost: invoice.total_cost, // Was 'cost'
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
                    _id: item._id,
                    product: item.product.toString(),
                    quantity: item.quantity.toString(),
                    volume: item.volume.toString(),
                    v_buy_price: item.v_buy_price.toString(),
                    v_pharmacy_price: item.v_pharmacy_price.toString(),
                    v_walkin_price: item.v_walkin_price.toString(),
                    expiry: item.expiry
                        ? item.expiry.toISOString().split("T")[0]
                        : "",
                    remaining: item.remaining?.toString() || "",
                }));

                return {
                    _id: invoice._id,
                    date: invoice.date.toISOString().split("T")[0],
                    supplier: invoice.supplier || null,
                    rows,
                    total_cost: invoice.total_cost, // Was 'cost'
                };
            })
        );

        res.status(200).json(fullInvoices);
    } catch (err) {
        console.error("getAllFullPurchaseInvoices error:", err);
        res.status(500).json({ error: "فشل في تحميل الفواتير" });
    }
};
