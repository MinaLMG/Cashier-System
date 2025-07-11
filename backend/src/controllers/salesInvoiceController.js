const SalesInvoice = require("../models/SalesInvoice");
const SalesItem = require("../models/SalesItem");
const PurchaseItem = require("../models/PurchaseItem");
const Product = require("../models/Product");
const HasVolume = require("../models/HasVolume");
const Volume = require("../models/Volume");
const updateProductRemaining = require("../helpers/updateProductRemaining");
const updateProductPrices = require("../helpers/productPricing");

// Helper function to generate serial number
const generateSalesInvoiceSerial = async (date) => {
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
    const latestInvoice = await SalesInvoice.findOne(
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

exports.createFullSalesInvoice = async (req, res) => {
    const { date, type, rows, customer, offer } = req.body;

    // Step 1: Validate invoice data
    if (!date || !type || !rows?.length) {
        const missing = [];
        if (!date) missing.push("تاريخ الفاتورة");
        if (!type) missing.push("نوع العميل");
        if (!rows?.length) missing.push("عناصر الفاتورة");

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

    // Validate type
    if (type !== "walkin" && type !== "pharmacy") {
        return res.status(400).json({
            error: "نوع العميل غير صالح",
        });
    }

    // Validate offer if provided
    if (offer !== undefined) {
        if (isNaN(Number(offer)) || Number(offer) < 0) {
            return res.status(400).json({
                error: "قيمة الخصم يجب أن تكون رقمًا غير سالب",
            });
        }
    }

    // Validate customer if provided
    if (customer) {
        try {
            const customerExists = await Customer.findById(customer);
            if (!customerExists) {
                return res.status(400).json({
                    error: "العميل غير موجود",
                });
            }

            // Validate customer type matches invoice type
            if (customerExists.type !== type) {
                return res.status(400).json({
                    error: "نوع العميل لا يتطابق مع نوع الفاتورة",
                });
            }
        } catch (err) {
            return res.status(400).json({
                error: "معرف العميل غير صالح",
            });
        }
    }

    let newInvoice = null;
    let createdItems = [];
    const modifiedPurchaseItemsBackup = [];

    try {
        // Step 2: Validate all rows
        const validRows = rows.filter(
            (r) =>
                r.product &&
                r.volume &&
                r.quantity &&
                !isNaN(Number(r.quantity))
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
                console.log(row.volume);
                const volumeExists = await Volume.findById(row.volume);
                if (!volumeExists) {
                    return res.status(400).json({
                        error: `العبوة غير موجودة: ${row.volume}`,
                    });
                }

                // Validate quantity is positive
                if (Number(row.quantity) <= 0) {
                    return res.status(400).json({
                        error: "الكمية يجب أن تكون رقمًا موجبًا",
                    });
                }
            } catch (err) {
                return res.status(400).json({
                    error: "معرف منتج أو عبوة غير صالح",
                });
            }
        }

        // Step 3: Check stock availability and prepare sales items
        const salesItems = [];

        for (const row of validRows) {
            const hasVolume = await HasVolume.findOne({
                product: row.product,
                volume: row.volume,
            });
            if (!hasVolume) {
                throw new Error("لم يتم العثور على العبوة للمنتج");
            }

            const baseQuantity = Number(row.quantity) * hasVolume.value;

            // Find available purchase items sorted by PurchaseInvoice.date (FIFO)
            let purchaseItems = await PurchaseItem.find({
                product: row.product,
                remaining: { $gt: 0 },
            }).populate("purchase_invoice"); // populate first

            // Now sort in JS by the actual purchase_invoice.date
            purchaseItems = purchaseItems.sort(
                (a, b) =>
                    new Date(a.purchase_invoice.date) -
                    new Date(b.purchase_invoice.date)
            );
            let remaining = baseQuantity;
            const sources = [];

            for (const pItem of purchaseItems) {
                if (remaining <= 0) break;

                const take = Math.min(pItem.remaining, remaining);

                // Backup
                modifiedPurchaseItemsBackup.push({
                    _id: pItem._id,
                    original_remaining: pItem.remaining,
                });

                sources.push({ purchase_item: pItem._id, quantity: take });
                pItem.remaining -= take;
                await pItem.save();
                remaining -= take;
            }

            if (remaining > 0) {
                throw new Error("الكمية المطلوبة غير متوفرة في المخزون");
            }

            const product = await Product.findById(row.product);
            const price =
                type === "walkin"
                    ? product.walkin_price
                    : product.pharmacy_price;

            salesItems.push({
                product: row.product,
                volume: row.volume,
                quantity: Number(row.quantity),
                price,
                sources,
            });
        }

        // Step 4: Calculate total cost and base cost
        const cost = salesItems.reduce((sum, item) => {
            return sum + item.quantity * item.price;
        }, 0);

        // Calculate base cost (buying price)
        let baseCost = 0;
        for (const item of salesItems) {
            for (const source of item.sources) {
                const purchaseItem = await PurchaseItem.findById(
                    source.purchase_item
                );

                // Get the volume value for the purchase item to normalize the cost
                const purchaseHasVolume = await HasVolume.findOne({
                    product: purchaseItem.product,
                    volume: purchaseItem.volume,
                });

                if (!purchaseHasVolume) {
                    console.error(
                        `Missing HasVolume for purchase item ${purchaseItem._id}`
                    );
                    continue;
                }

                // Calculate the cost per base unit
                const costPerBaseUnit =
                    purchaseItem.buy_price / purchaseHasVolume.value;

                // Add to the base cost (source.quantity is already in base units)
                baseCost += source.quantity * costPerBaseUnit;
            }
        }

        // Generate serial number
        const serial = await generateSalesInvoiceSerial(date);

        // Step 5: Create SalesInvoice
        newInvoice = await SalesInvoice.create({
            date,
            type,
            user: req.user?._id || null,
            cost,
            base: baseCost, // Add the base cost
            customer: customer ? customer : null,
            offer,
            serial,
            createdAt: new Date(),
        });

        // Step 6: Create all sales items
        for (const item of salesItems) {
            await SalesItem.create({
                sales_invoice: newInvoice._id,
                product: item.product,
                volume: item.volume,
                quantity: item.quantity,
                price: item.price,
                sources: item.sources,
            });
        }

        // Step 7: Update product values
        const affectedProducts = new Set(validRows.map((r) => r.product));
        for (const productId of affectedProducts) {
            await updateProductPrices(productId);
            await updateProductRemaining(productId);
        }

        return res.status(201).json({
            message: "تم حفظ الفاتورة بنجاح",
            invoice: newInvoice,
        });
    } catch (err) {
        console.error("خطأ في حفظ فاتورة البيع:", err);

        // rollback
        try {
            // Restore modified purchase items
            for (const backup of modifiedPurchaseItemsBackup) {
                await PurchaseItem.findByIdAndUpdate(backup._id, {
                    remaining: backup.original_remaining,
                });
            }

            if (newInvoice?._id) {
                await SalesInvoice.findByIdAndDelete(newInvoice._id);
                await SalesItem.deleteMany({ sales_invoice: newInvoice._id });
            }
        } catch (rollbackErr) {
            console.error("خطأ أثناء التراجع عن التغييرات:", rollbackErr);
        }

        return res.status(500).json({
            error: "فشل في حفظ الفاتورة. يرجى المحاولة مرة أخرى.",
        });
    }
};

exports.getFullSalesInvoices = async (req, res) => {
    try {
        const invoices = await SalesInvoice.find().sort({ date: -1 });

        const result = await Promise.all(
            invoices.map(async (inv) => {
                const items = await SalesItem.find({
                    sales_invoice: inv._id,
                });

                const finalTotal = (inv.cost || 0) - (inv.offer || 0);
                const profit = finalTotal - (inv.base || 0);

                return {
                    _id: inv._id,
                    customer: inv.customer || "",
                    type: inv.type || "walkin",
                    date: inv.date.toISOString().split("T")[0],
                    offer: inv.offer || 0,
                    rows: items.map((item) => ({
                        product: item.product,
                        volume: item.volume,
                        quantity: item.quantity,
                    })),
                    total: inv.cost || 0,
                    finalTotal,
                    base: inv.base || 0,
                    profit: profit,
                };
            })
        );

        res.json(result);
    } catch (err) {
        console.error("❌ Error in getFullSalesInvoices:", err);
        res.status(500).json({
            error: "فشل في تحميل فواتير البيع",
        });
    }
};
