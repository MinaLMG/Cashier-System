 const Product = require("../models/Product");
const HasVolume = require("../models/HasVolume");

// Helper function to check if conversions have non-barcode changes
const hasNonBarcodeConversionChanges = (currentConversions, newConversions) => {
    if (!currentConversions || !newConversions) return false;
    
    // Create maps for easier comparison
    const currentMap = new Map();
    const newMap = new Map();
    
    currentConversions.forEach(conv => {
        currentMap.set(`${conv.from}-${conv.to}`, {
            from: conv.from,
            to: conv.to,
            value: conv.value,
            barcode: conv.barcode || null
        });
    });
    
    newConversions.forEach(conv => {
        newMap.set(`${conv.from}-${conv.to}`, {
            from: conv.from,
            to: conv.to,
            value: conv.value,
            barcode: conv.barcode || null
        });
    });
    
    // Check if any conversion has changed in non-barcode fields
    for (const [key, currentConv] of currentMap) {
        const newConv = newMap.get(key);
        
        // If conversion was removed, that's a non-barcode change
        if (!newConv) return true;
        
        // Check if from, to, or value changed
        if (currentConv.from !== newConv.from || 
            currentConv.to !== newConv.to || 
            currentConv.value !== newConv.value) {
            return true;
        }
    }
    
    // Check if any new conversions were added
    for (const [key, newConv] of newMap) {
        if (!currentMap.has(key)) return true;
    }
    
    return false;
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        console.error("getAllProducts error:", err);
        res.status(500).json({ error: "Failed to fetch products." });
    }
};

exports.createProduct = async (req, res) => {
    const { name, min_stock, category, default_volume } = req.body;

    // Validate required fields
    if (!name || !category)
        return res
            .status(400)
            .json({ error: "Name and category are required." });

    // Validate min_stock is a non-negative number if provided
    if (
        min_stock !== undefined &&
        (isNaN(Number(min_stock)) || Number(min_stock) < 0)
    ) {
        return res
            .status(400)
            .json({ error: "Minimum stock must be a non-negative number." });
    }

    try {
        // Check for duplicate product name
        const existing = await Product.findOne({ name });
        if (existing)
            return res.status(409).json({ error: "Product already exists." });

        const product = new Product({
            name,
            min_stock,
            category,
            default_volume,
        });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to create product." });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if product has been used in purchases before allowing conversion modifications
        if (req.body.conversions) {
            try {
                const PurchaseItem = require("../models/PurchaseItem");
                const purchaseItemsCount = await PurchaseItem.countDocuments({
                    product: productId,
                });

                if (purchaseItemsCount > 0) {
                    // Get current product to compare conversions
                    const currentProduct = await Product.findById(productId);
                    if (currentProduct) {
                        // Check if conversions have non-barcode changes
                        if (hasNonBarcodeConversionChanges(currentProduct.conversions, req.body.conversions)) {
                            return res.status(400).json({
                                error: "لا يمكن تعديل تحويلات المنتج (من، إلى، القيمة) - تم استخدامه في فواتير المشتريات. يمكن تعديل الباركود فقط.",
                                canModifyConversions: false,
                                purchaseItemsCount,
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking product usage:", err);
                // Continue with update if check fails (don't block the update)
            }
        }

        const product = await Product.findByIdAndUpdate(productId, req.body, {
            new: true,
            runValidators: true,
        });
        if (!product)
            return res.status(404).json({ error: "Product not found." });

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product." });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        // Step 1: Delete the product
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        // Step 2: Delete related HasVolume entries
        await HasVolume.deleteMany({ product: product._id });

        res.status(200).json({ message: "تم حذف المنتج وجميع تحويلاته" });
    } catch (err) {
        console.error("deleteProduct error:", err);
        res.status(500).json({ error: "فشل في حذف المنتج" });
    }
};

exports.createFullProduct = async (req, res) => {
    try {
        const { name, "min-stock": minStock, conversions, values } = req.body;

        // Validate required fields
        if (!name || !conversions?.length) {
            return res.status(400).json({ error: "بيانات المنتج غير مكتملة" });
        }

        // Validate min-stock is a non-negative number if provided
        if (
            minStock !== undefined &&
            (isNaN(Number(minStock)) || Number(minStock) < 0)
        ) {
            return res.status(400).json({
                error: "الحد الأدنى للمخزون يجب أن يكون رقمًا غير سالب",
            });
        }

        // Validate conversions
        for (let i = 0; i < conversions.length; i++) {
            const conv = conversions[i];

            // First conversion only needs 'from' and 'value'
            if (i === 0) {
                if (!conv.from) {
                    return res.status(400).json({
                        error: "الوحدة الأساسية مطلوبة",
                    });
                }

                if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                    return res.status(400).json({
                        error: "قيمة التحويل يجب أن تكون رقمًا موجبًا",
                    });
                }
            } else {
                // Other conversions need both 'from', 'to', and 'value'
                if (!conv.from || !conv.to) {
                    return res.status(400).json({
                        error: "جميع التحويلات يجب أن تحتوي على وحدات المصدر والهدف",
                    });
                }

                if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                    return res.status(400).json({
                        error: "قيمة التحويل يجب أن تكون رقمًا موجبًا",
                    });
                }
            }
        }

        // Check for duplicate barcodes in the request body
        const seen = new Set();
        for (const conv of conversions) {
            const barcode = conv.barcode?.trim();
            if (barcode) {
                if (seen.has(barcode)) {
                    return res.status(400).json({
                        error: `الباركود "${barcode}" مكرر داخل نفس الطلب`,
                    });
                }
                seen.add(barcode);
            }
        }

        // Check for existing barcodes in the database
        const barcodes = conversions
            .map((conv) => conv.barcode?.trim())
            .filter(Boolean);

        if (barcodes.length > 0) {
            const existingBarcodes = await HasVolume.find({
                barcode: { $in: barcodes },
            });

            if (existingBarcodes.length > 0) {
                const duplicateBarcode = existingBarcodes[0].barcode;
                return res.status(400).json({
                    error: `الباركود "${duplicateBarcode}" مستخدم من قبل في منتج آخر`,
                });
            }
        }

        // Step 1: Create the product
        const newProduct = await Product.create({
            name,
            min_stock: minStock,
            conversions,
        });

        // Step 2: Prepare hasVolume entries
        const volumeRecords = values.map(({ id, val }) => {
            const conversion = conversions.find((c) => c.from === id);
            return {
                product: newProduct._id,
                volume: id,
                value: val,
                barcode: conversion?.barcode?.trim() || null,
            };
        });

        // Step 3: Try inserting hasVolumes
        try {
            await HasVolume.insertMany(volumeRecords);
        } catch (volumeErr) {
            await Promise.all([
                Product.findByIdAndDelete(newProduct._id),
                HasVolume.deleteMany({ product: newProduct._id }),
            ]);

            // 🧠 Check if it's a duplicate barcode in DB
            if (volumeErr.code === 11000 && volumeErr.writeErrors?.length) {
                const duplicateBarcodeError = volumeErr.writeErrors.find((e) =>
                    e.err?.errmsg?.includes("barcode_1")
                );

                if (duplicateBarcodeError) {
                    const msg = duplicateBarcodeError.err?.errmsg || "";
                    const matched = msg.match(/dup key: { barcode: "(.*?)" }/);
                    const barcode = matched?.[1];

                    return res.status(400).json({
                        error: barcode
                            ? `الباركود "${barcode}" مستخدم من قبل`
                            : "باركود مكرر مستخدم من قبل",
                    });
                }
            }

            throw volumeErr; // fallback
        }

        return res.status(201).json({
            message: "تم إنشاء المنتج بكل التحويلات",
            product: newProduct,
        });
    } catch (err) {
        // Handle duplicate product name
        if (err.code === 11000 && err.keyPattern?.name) {
            return res.status(400).json({ error: "اسم المنتج موجود بالفعل" });
        }

        console.error("createFullProduct error:", err);
        return res.status(500).json({ error: "حدث خطأ أثناء حفظ المنتج" });
    }
};

exports.updateFullProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, "min-stock": minStock, conversions, values } = req.body;

    if (!name || !conversions?.length || !values?.length) {
        return res.status(400).json({ error: "بيانات المنتج غير مكتملة" });
    }

    // Check if product has been used in purchases before allowing conversion modifications
    try {
        const PurchaseItem = require("../models/PurchaseItem");
        const purchaseItemsCount = await PurchaseItem.countDocuments({
            product: productId,
        });

        if (purchaseItemsCount > 0) {
            // Get current product to compare conversions
            const currentProduct = await Product.findById(productId);
            if (currentProduct) {
                // Check if conversions have non-barcode changes
                if (hasNonBarcodeConversionChanges(currentProduct.conversions, conversions)) {
                    return res.status(400).json({
                        error: "لا يمكن تعديل تحويلات المنتج (من، إلى، القيمة) - تم استخدامه في فواتير المشتريات. يمكن تعديل الباركود فقط.",
                        canModifyConversions: false,
                        purchaseItemsCount,
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error checking product usage:", err);
        // Continue with update if check fails (don't block the update)
    }

    // Validate conversions
    for (let i = 0; i < conversions.length; i++) {
        const conv = conversions[i];

        // First conversion only needs 'from' and 'value'
        if (i === 0) {
            if (!conv.from) {
                return res.status(400).json({
                    error: "الوحدة الأساسية مطلوبة",
                });
            }

            if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                return res.status(400).json({
                    error: "قيمة التحويل يجب أن تكون رقمًا موجبًا",
                });
            }
        } else {
            // Other conversions need both 'from', 'to', and 'value'
            if (!conv.from || !conv.to) {
                return res.status(400).json({
                    error: "جميع التحويلات يجب أن تحتوي على وحدات المصدر والهدف",
                });
            }

            if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                return res.status(400).json({
                    error: "قيمة التحويل يجب أن تكون رقمًا موجبًا",
                });
            }
        }
    }

    // Step 0: Check for duplicate barcodes inside the request itself
    const seen = new Set();
    const duplicateInRequest = conversions
        .map((c) => c.barcode?.trim())
        .filter(Boolean) // filters out empty and null
        .find((b) => {
            if (seen.has(b)) return true;
            seen.add(b);
            return false;
        });

    if (duplicateInRequest) {
        return res.status(400).json({
            error: `الباركود "${duplicateInRequest}" مكرر داخل نفس المنتج`,
        });
    }

    // Check for existing barcodes in the database that belong to other products
    const barcodes = conversions
        .map((conv) => conv.barcode?.trim())
        .filter(Boolean);

    if (barcodes.length > 0) {
        const existingBarcodes = await HasVolume.find({
            barcode: { $in: barcodes },
            product: { $ne: productId }, // Exclude current product
        });

        if (existingBarcodes.length > 0) {
            const duplicateBarcode = existingBarcodes[0].barcode;
            return res.status(400).json({
                error: `الباركود "${duplicateBarcode}" مستخدم من قبل في منتج آخر`,
            });
        }
    }

    let oldProduct = null;
    let oldHasVolumes = [];

    try {
        // Step 1: Backup current product and volume state
        oldProduct = await Product.findById(productId);
        if (!oldProduct) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        oldHasVolumes = await HasVolume.find({ product: productId });

        // Step 2: Update product info
        await Product.findByIdAndUpdate(productId, {
            name,
            min_stock: minStock,
            conversions,
        });

        // Step 3: Prepare updates, inserts, and deletion tracking
        const updates = [];
        const inserts = [];
        const volumeIdsToKeep = new Set();

        for (const val of values) {
            const conversion = conversions.find((c) => c.from === val.id);
            if (!conversion) continue;

            volumeIdsToKeep.add(val.id);

            const existing = oldHasVolumes.find(
                (hv) => hv.volume.toString() === val.id
            );

            if (existing) {
                // Update
                updates.push({
                    updateOne: {
                        filter: { _id: existing._id },
                        update: {
                            $set: {
                                value: val.val,
                                barcode: conversion.barcode?.trim() || null,
                            },
                        },
                    },
                });
            } else {
                // New volume to insert
                inserts.push({
                    product: productId,
                    volume: val.id,
                    value: val.val,
                    barcode: conversion.barcode?.trim() || null,
                });
            }
        }

        // Step 4: Apply updates
        if (updates.length > 0) {
            await HasVolume.bulkWrite(updates);
        }

        // Step 5: Insert new ones
        let insertedDocs = [];
        if (inserts.length > 0) {
            insertedDocs = await HasVolume.insertMany(inserts);
        }

        // Step 6: Delete removed volumes
        const oldVolumeIds = oldHasVolumes.map((v) => v.volume.toString());
        const volumeIdsToDelete = oldVolumeIds.filter(
            (id) => !volumeIdsToKeep.has(id)
        );

        if (volumeIdsToDelete.length > 0) {
            await HasVolume.deleteMany({
                product: productId,
                volume: { $in: volumeIdsToDelete },
            });
        }

        return res.status(200).json({
            message: "تم تعديل المنتج بكل التحويلات",
        });
    } catch (err) {
        console.error("updateFullProduct error:", err);

        // === Manual Rollback ===
        try {
            // 1. Revert product info
            if (oldProduct) {
                await Product.findByIdAndUpdate(
                    productId,
                    oldProduct.toObject()
                );
            }

            // 2. Remove newly added volumes
            const insertedIds = (
                Array.isArray(insertedDocs) ? insertedDocs : []
            ).map((doc) => doc._id);
            if (insertedIds.length > 0) {
                await HasVolume.deleteMany({ _id: { $in: insertedIds } });
            }

            // 3. Restore deleted or edited volumes (upsert ensures restoration)
            const restoreOps = oldHasVolumes.map((doc) => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: {
                        $set: {
                            product: doc.product,
                            volume: doc.volume,
                            value: doc.value,
                            barcode: doc.barcode,
                        },
                    },
                    upsert: true,
                },
            }));

            if (restoreOps.length > 0) {
                await HasVolume.bulkWrite(restoreOps);
            }
        } catch (rollbackErr) {
            console.error("❌ Rollback failed:", rollbackErr);
        }

        // === Error feedback to frontend ===
        if (err.code === 11000 && err.keyPattern?.barcode) {
            const duplicateBarcode = err.keyValue?.barcode;
            return res.status(400).json({
                error: duplicateBarcode
                    ? `الباركود "${duplicateBarcode}" مستخدم من قبل في منتج آخر`
                    : "باركود مكرر مستخدم من قبل",
            });
        }

        return res.status(500).json({
            error: "حدث خطأ أثناء تعديل المنتج، يرجى المحاولة لاحق",
        });
    }
};

exports.getFullProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        // Get all HasVolume entries for this product
        const volumeEntries = await HasVolume.find({
            product: product._id,
        }).populate("volume");

        const values = volumeEntries.map((entry) => ({
            id: entry.volume._id,
            name: entry.volume.name,
            val: entry.value,
        }));

        res.status(200).json({
            id: product._id,
            name: product.name,
            "min-stock": product.min_stock,
            conversions: product.conversions,
            values,
            walkin_price: product.walkin_price,
            pharmacy_price: product.pharmacy_price,
            total_remaining: product.total_remaining,
        });
    } catch (err) {
        console.error("getFullProduct error:", err);
        res.status(500).json({ error: "فشل في جلب بيانات المنتج" });
    }
};

exports.getAllFullProducts = async (req, res) => {
    try {
        // Update the query to sort by name
        const products = await Product.find().sort({ name: 1 });

        const result = await Promise.all(
            products.map(async (product) => {
                const hasVolumes = await HasVolume.find({
                    product: product._id,
                }).populate("volume");

                const values = hasVolumes.map((hv) => ({
                    id: hv.volume._id,
                    name: hv.volume.name,
                    val: hv.value,
                }));
                return {
                    _id: product._id,
                    name: product.name,
                    "min-stock": product.min_stock,
                    conversions: product.conversions,
                    values,
                    u_walkin_price: product.u_walkin_price, // Was customer/cust price
                    u_pharmacy_price: product.u_pharmacy_price,
                    total_remaining: product.total_remaining,
                };
            })
        );

        res.status(200).json(result);
    } catch (err) {
        console.error("getFullProducts error:", err);
        res.status(500).json({ error: "فشل في تحميل المنتجات الكاملة" });
    }
};

// Check if product has been used in any purchase invoices
exports.checkProductUsageInPurchases = async (req, res) => {
    try {
        const { id } = req.params;

        const PurchaseItem = require("../models/PurchaseItem");

        // Check if there are any purchase items with this product
        const purchaseItemsCount = await PurchaseItem.countDocuments({
            product: id,
        });

        res.status(200).json({
            isUsedInPurchases: purchaseItemsCount > 0,
            purchaseItemsCount,
        });
    } catch (err) {
        console.error("checkProductUsageInPurchases error:", err);
        res.status(500).json({ error: "فشل في التحقق من استخدام المنتج" });
    }
};

// Check if product conversions can be modified (not used in any purchase invoices)
exports.checkProductConversionsModifiable = async (req, res) => {
    try {
        const { id } = req.params;

        const PurchaseItem = require("../models/PurchaseItem");

        // Check if there are any purchase items with this product
        const purchaseItemsCount = await PurchaseItem.countDocuments({
            product: id,
        });

        const canModifyConversions = purchaseItemsCount === 0;

        res.status(200).json({
            canModifyConversions,
            purchaseItemsCount,
            canModifyBarcode: true, // Always allow barcode modification
            message: canModifyConversions
                ? "يمكن تعديل جميع تحويلات المنتج"
                : "يمكن تعديل الباركود فقط - تم استخدام المنتج في فواتير المشتريات",
        });
    } catch (err) {
        console.error("checkProductConversionsModifiable error:", err);
        res.status(500).json({
            error: "فشل في التحقق من إمكانية تعديل تحويلات المنتج",
        });
    }
};
