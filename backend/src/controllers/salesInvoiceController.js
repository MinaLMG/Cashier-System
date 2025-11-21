const SalesInvoice = require("../models/SalesInvoice");
const SalesItem = require("../models/SalesItem");
const PurchaseItem = require("../models/PurchaseItem");
const Product = require("../models/Product");
const HasVolume = require("../models/HasVolume");
const Volume = require("../models/Volume");
const Customer = require("../models/Customer");
const updateProductRemaining = require("../helpers/updateProductRemaining");
const updateProductPrices = require("../helpers/productPricing");
const ReturnItem = require("../models/ReturnItem");

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
    const { date, notes } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required." });

    try {
        const invoice = new SalesInvoice({ date, notes: notes || "" });
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: "Failed to create sales invoice." });
    }
};

exports.updateSalesInvoice = async (req, res) => {
    try {
        const { customer, type, date, offer, notes } = req.body;

        // Validate required fields
        if (!date || !type) {
            return res.status(400).json({
                error: "بيانات ناقصة",
                details: "يجب إدخال التاريخ ونوع العميل",
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

        // Get the existing invoice with its items
        const existingInvoice = await SalesInvoice.findById(req.params.id);
        if (!existingInvoice) {
            return res.status(404).json({ error: "الفاتورة غير موجودة" });
        }

        // Get all sales items for this invoice
        const salesItems = await SalesItem.find({
            sales_invoice: req.params.id,
        })
            .populate("product")
            .populate("sources.purchase_item");

        let updateData = {
            date: new Date(date),
            customer: customer || null,
            offer: Number(offer || 0),
            notes: notes || "",
        };

        // Check if customer type has changed
        if (type !== existingInvoice.type) {
            // Type has changed, need to recalculate total_selling_price
            let newTotalSellingPrice = 0;

            // Calculate new selling price based on the new customer type
            for (const item of salesItems) {
                const product = item.product;
                if (!product) continue;

                // Get the volume value from the HasVolume model
                const hasVolume = await HasVolume.findOne({
                    product: item.product._id,
                    volume: item.volume,
                });

                if (!hasVolume) continue;

                // IMPORTANT: For each item, check the purchase items that were the sources
                // to determine what the price would have been at the time of invoice creation
                let highestUnitPrice =
                    type === "walkin"
                        ? product.u_walkin_price
                        : product.u_pharmacy_price;

                // If we have sources, check their prices
                if (item.sources && item.sources.length > 0) {
                    for (const source of item.sources) {
                        if (!source.purchase_item) continue;

                        // Get the purchase item that was the source
                        const purchaseItem = source.purchase_item;

                        // Get the volume value for the purchase item
                        const purchaseHasVolume = await HasVolume.findOne({
                            product: purchaseItem.product,
                            volume: purchaseItem.volume,
                        });

                        if (!purchaseHasVolume) continue;

                        // Calculate the unit price based on the new customer type
                        const unitPrice =
                            type === "walkin"
                                ? purchaseItem.v_walkin_price /
                                  purchaseHasVolume.value
                                : purchaseItem.v_pharmacy_price /
                                  purchaseHasVolume.value;

                        // Keep track of the highest unit price
                        if (unitPrice > highestUnitPrice) {
                            highestUnitPrice = unitPrice;
                        }
                    }
                }

                // Calculate the volume price
                const volumePrice = highestUnitPrice * hasVolume.value;

                // Add to the total
                newTotalSellingPrice += item.quantity * volumePrice;

                // Update the item's price in the database
                await SalesItem.findByIdAndUpdate(item._id, {
                    v_price: volumePrice,
                });
            }

            // Update the invoice with the new total selling price
            updateData.total_selling_price = newTotalSellingPrice;
            updateData.type = type;

            // Calculate new final amount
            updateData.final_amount = newTotalSellingPrice - Number(offer || 0);

            // Calculate new profit (revenue)
            updateData.total_purchase_cost =
                existingInvoice.total_purchase_cost;
        } else {
            // Type hasn't changed, just recalculate final_amount based on new offer
            updateData.final_amount =
                existingInvoice.total_selling_price - Number(offer || 0);
        }

        // Update the invoice
        const updatedInvoice = await SalesInvoice.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json(updatedInvoice);
    } catch (err) {
        console.error("Error updating sales invoice:", err);
        res.status(500).json({
            error: "فشل في تحديث فاتورة المبيعات",
            details: err.message,
        });
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
    const { date, type, rows, customer, offer, notes } = req.body;

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
            const u_price =
                type === "walkin"
                    ? product.u_walkin_price
                    : product.u_pharmacy_price;

            salesItems.push({
                product: row.product,
                volume: row.volume,
                quantity: Number(row.quantity),
                u_price,
                sources,
                val: hasVolume.value,
            });
        }

        // Step 4: Calculate total selling price
        const total_selling_price = salesItems.reduce((sum, item) => {
            return sum + item.quantity * item.u_price * item.val;
        }, 0);

        // Calculate final amount after discount
        const final_amount = total_selling_price - (offer || 0);

        // Calculate total purchase cost (buying price)
        let total_purchase_cost = 0;
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
                const u_cost =
                    purchaseItem.v_buy_price / purchaseHasVolume.value;

                // Add to the base cost (source.quantity is already in base units)
                total_purchase_cost += source.quantity * u_cost;
            }
        }

        // Generate serial number
        const serial = await generateSalesInvoiceSerial(date);

        // Step 5: Create SalesInvoice
        newInvoice = await SalesInvoice.create({
            date,
            type,
            user: req.user?._id || null,
            total_selling_price: total_selling_price,
            final_amount: final_amount,
            total_purchase_cost: total_purchase_cost,
            customer: customer ? customer : null,
            createdAt: new Date(),
            offer: offer || 0,
            notes: notes || "",
            serial,
        });

        // Step 6: Create all sales items
        for (const item of salesItems) {
            await SalesItem.create({
                sales_invoice: newInvoice._id,
                product: item.product,
                volume: item.volume,
                quantity: item.quantity, // Initialize with total returnable quantity in base units
                v_price: item.u_price * item.val,
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

// Get available volumes for return for a specific sales item
// Modified to work with individual sales item ID
exports.getAvailableReturnVolumesForInvoiceItem = async (req, res) => {
    try {
        const { salesItemId } = req.params;

        // Get the sales item with all related data
        const salesItem = await SalesItem.findById(salesItemId)
            .populate("product")
            .populate("volume")
            .populate("sales_invoice");

        if (!salesItem) {
            return res.status(404).json({ error: "Sales item not found." });
        }

        // Get all existing return items for this sales item to calculate what's already been returned
        const existingReturnItems = await ReturnItem.find({
            sales_item: salesItemId,
        }).populate("volume");

        // Calculate total already returned in base units
        let totalReturnedBaseUnits = 0;
        for (const returnItem of existingReturnItems) {
            const returnHasVolume = await HasVolume.findOne({
                product: salesItem.product._id,
                volume: returnItem.volume._id,
            });
            if (returnHasVolume) {
                totalReturnedBaseUnits +=
                    returnItem.quantity * returnHasVolume.value;
            }
        }

        // Calculate available quantity to return (original quantity - already returned)
        const originalBaseQuantity =
            salesItem.quantity *
            (
                await HasVolume.findOne({
                    product: salesItem.product._id,
                    volume: salesItem.volume._id,
                })
            ).value;

        const availableBaseQuantity =
            originalBaseQuantity - totalReturnedBaseUnits;
        if (availableBaseQuantity <= 0) {
            return res.status(200).json({
                salesItem: {
                    _id: salesItem._id,
                    product: salesItem.product,
                    soldVolume: salesItem.volume,
                    quantity: salesItem.quantity,
                    v_price: salesItem.v_price,
                    availableToReturn: 0,
                },
                availableVolumes: [],
                message: "No quantity available for return",
            });
        }

        // Get the product's sold volume
        const soldHasVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: salesItem.volume._id,
        });

        if (!soldHasVolume) {
            return res
                .status(400)
                .json({ error: "Could not find sold volume." });
        }

        // Get all volumes for this product that are smaller than or equal to the sold volume
        const availableVolumes = await HasVolume.find({
            product: salesItem.product._id,
            value: { $lte: availableBaseQuantity },
        })
            .populate("volume")
            .populate("product");
        // Calculate available quantities for each volume
        const volumesWithQuantity = availableVolumes
            .map((hv) => {
                const maxVolumeQuantity = Math.floor(
                    availableBaseQuantity / hv.value
                );

                return {
                    volume: hv.volume,
                    value: hv.value,
                    maxQuantity: maxVolumeQuantity,
                    barcode: hv.barcode,
                    sale_price: hv.sale_price,
                };
            })
            .filter((vol) => vol.maxQuantity > 0); // Only return volumes that can actually be returned

        res.status(200).json({
            salesItem: {
                _id: salesItem._id,
                product: salesItem.product,
                soldVolume: {
                    _id: soldHasVolume.volume,
                    value: soldHasVolume.value,
                },
                quantity: salesItem.quantity,
                v_price: salesItem.v_price,
                availableToReturn: availableBaseQuantity,
                alreadyReturned: totalReturnedBaseUnits,
            },
            availableBaseQuantity: availableBaseQuantity,
            availableVolumes: volumesWithQuantity,
        });
    } catch (err) {
        console.error(
            "Error getting available return volumes for invoice item:",
            err
        );
        res.status(500).json({
            error: "حدث خطأ أثناء جلب الأحجام المتاحة للإرجاع",
        });
    }
};

exports.getAvailableReturnVolumes = async (req, res) => {
    try {
        const { salesItemId } = req.params;

        // Get the sales item with product populated
        const salesItem = await SalesItem.findById(salesItemId).populate(
            "product"
        );

        if (!salesItem) {
            return res.status(404).json({ error: "Sales item not found." });
        }

        // Get the product's sold volume
        const soldHasVolume = await HasVolume.findOne({
            product: salesItem.product._id,
            volume: salesItem.volume,
        });

        if (!soldHasVolume) {
            return res
                .status(400)
                .json({ error: "Could not find sold volume." });
        }

        // Get all volumes for this product that are smaller than or equal to the sold volume
        const availableVolumes = await HasVolume.find({
            product: salesItem.product._id,
            value: { $lte: soldHasVolume.value },
        })
            .populate("volume")
            .populate("product");

        // Calculate available quantities for each volume using to_return field
        const volumesWithQuantity = availableVolumes.map((hv) => {
            const maxBaseQuantity = salesItem.to_return || 0;
            const maxVolumeQuantity = Math.floor(maxBaseQuantity / hv.value);

            return {
                volume: hv.volume,
                value: hv.value,
                maxQuantity: maxVolumeQuantity,
                barcode: hv.barcode,
            };
        });

        res.status(200).json({
            salesItem: {
                _id: salesItem._id,
                product: salesItem.product,
                soldVolume: {
                    _id: soldHasVolume.volume,
                    value: soldHasVolume.value,
                },
                quantity: salesItem.quantity,
            },
            availableVolumes: volumesWithQuantity,
        });
    } catch (err) {
        console.error("Error getting available return volumes:", err);
        res.status(500).json({
            error: "حدث خطأ أثناء جلب الأحجام المتاحة للإرجاع",
        });
    }
};

exports.getFullSalesInvoices = async (req, res) => {
    try {
        const { offset, size } = req.query;

        const parsedOffset = Number.parseInt(offset, 10);
        const parsedSize = Number.parseInt(size, 10);
        const safeOffset =
            Number.isFinite(parsedOffset) && parsedOffset >= 0
                ? parsedOffset
                : 0;
        const safeSize =
            Number.isFinite(parsedSize) && parsedSize > 0
                ? Math.min(parsedSize, 500)
                : 50;

        const total = await SalesInvoice.countDocuments();

        const invoices = await SalesInvoice.find()
            .sort({ date: -1, created_at: -1 })
            .skip(safeOffset)
            .limit(safeSize);

        const items = await Promise.all(
            invoices.map(async (inv) => {
                const rows = await SalesItem.find({
                    sales_invoice: inv._id,
                });

                const profit = inv.final_amount - inv.total_purchase_cost;

                return {
                    _id: inv._id,
                    customer: inv.customer || "",
                    type: inv.type || "walkin",
                    date: inv.date,
                    offer: inv.offer || 0,
                    notes: inv.notes || "",
                    rows: rows.map((item) => ({
                        product: item.product,
                        volume: item.volume,
                        quantity: item.quantity,
                        v_price: item.v_price,
                    })),
                    total_selling_price: inv.total_selling_price || 0,
                    final_amount: inv.final_amount || 0,
                    total_purchase_cost: inv.total_purchase_cost || 0,
                    profit: profit,
                };
            })
        );

        return res.status(200).json({
            items,
            total,
        });
    } catch (err) {
        console.error("Error fetching sales invoices:", err);
        return res.status(500).json({
            error: "فشل في جلب فواتير المبيعات",
        });
    }
};
