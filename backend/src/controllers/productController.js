const Product = require("../models/Product");
const HasVolume = require("../models/HasVolume");

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate(
            "category default_volume"
        );
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products." });
    }
};

exports.createProduct = async (req, res) => {
    const { name, min_stock, category, default_volume } = req.body;
    if (!name || !category)
        return res
            .status(400)
            .json({ error: "Name and category are required." });

    try {
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
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
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

        if (!name || !conversions?.length) {
            return res.status(400).json({ error: "بيانات المنتج غير مكتملة" });
        }

        // 🚨 Check for duplicate barcodes in the request body
        const seen = new Set();
        for (const conv of conversions) {
            if (conv.barcode) {
                if (seen.has(conv.barcode)) {
                    return res.status(400).json({
                        error: `الباركود "${conv.barcode}" مكرر `,
                    });
                }
                seen.add(conv.barcode);
            }
        }

        // Step 1: Create the product
        const newProduct = await Product.create({
            name,
            min_stock: minStock,
        });

        // Step 2: Prepare hasVolume entries
        const volumeRecords = values.map(({ id, val }) => {
            const conversion = conversions.find((c) => c.from === id);
            return {
                product: newProduct._id,
                volume: id,
                value: val,
                barcode: conversion?.barcode || "",
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
