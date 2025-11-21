// File: seedProducts.js
// Seed script for volumes and products using controller methods

const mongoose = require("mongoose");
const connectDB = require("./src/db/connect");

// Load models
const Volume = require("./src/models/Volume");
const Product = require("./src/models/Product");
const HasVolume = require("./src/models/HasVolume");

// Arabic volume names
const ARABIC_VOLUMES = {
    piece: "قطعة",
    bag: "كيس",
    box: "علبة",
    packet: "رزمة",
};

// Arabic product name templates
const PRODUCT_CATEGORIES = [
    "باراسيتامول",
    "إيبوبروفين",
    "أموكسيسيلين",
    "أزيثروميسين",
    "سيفالكسين",
    "ميتفورمين",
    "أوميبرازول",
    "لانسوبرازول",
    "أتينولول",
    "أملوديبين",
    "فوروسيميد",
    "وارفارين",
    "أسبرين",
    "كلوبيدوجريل",
    "ستاتين",
    "أنسولين",
    "جلوكوفاج",
    "فيتامين د",
    "كالسيوم",
    "حديد",
    "زنك",
    "مغنيسيوم",
    "بروبيوتيك",
    "أوميغا 3",
    "مضاد حيوي",
    "مسكن ألم",
    "مضاد التهاب",
    "مضاد هيستامين",
    "مضاد سعال",
    "مقشع",
    "قطرة عين",
    "مرهم",
    "كريم",
    "جل",
    "شامبو",
    "صابون",
    "معقم",
    "ضمادة",
    "شاش",
    "قطن طبي",
];

// Helper function to generate random Arabic product name
const generateProductName = (index) => {
    const category = PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length];
    const variant = Math.floor(index / PRODUCT_CATEGORIES.length) + 1;
    if (variant === 1) {
        return category;
    }
    return `${category} ${variant}`;
};

// Global set to track generated barcodes to avoid duplicates
const generatedBarcodes = new Set();

// Helper function to generate random barcode
const generateBarcode = () => {
    let barcode;
    let attempts = 0;
    do {
        barcode = Math.floor(
            1000000000000 + Math.random() * 9000000000000
        ).toString();
        attempts++;
        if (attempts > 100) {
            throw new Error(
                "Failed to generate unique barcode after 100 attempts"
            );
        }
    } while (generatedBarcodes.has(barcode));

    generatedBarcodes.add(barcode);
    return barcode;
};

// Helper function to create volume (following createVolume controller logic)
const createVolume = async (name) => {
    try {
        const existing = await Volume.findOne({ name });
        if (existing) {
            console.log(`Volume "${name}" already exists, skipping...`);
            return existing;
        }

        const volume = new Volume({ name });
        await volume.save();
        console.log(`✅ Created volume: ${name}`);
        return volume;
    } catch (err) {
        console.error(`❌ Failed to create volume "${name}":`, err);
        throw err;
    }
};

// Helper function to create full product (following createFullProduct controller logic)
const createFullProduct = async (productData) => {
    const { name, minStock, conversions, values } = productData;

    try {
        // Validate required fields
        if (!name || !conversions?.length) {
            throw new Error("بيانات المنتج غير مكتملة");
        }

        // Validate min-stock
        if (
            minStock !== undefined &&
            (isNaN(Number(minStock)) || Number(minStock) < 0)
        ) {
            throw new Error("الحد الأدنى للمخزون يجب أن يكون رقمًا غير سالب");
        }

        // Validate conversions
        for (let i = 0; i < conversions.length; i++) {
            const conv = conversions[i];

            if (i === 0) {
                if (!conv.from) {
                    throw new Error("الوحدة الأساسية مطلوبة");
                }
                if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                    throw new Error("قيمة التحويل يجب أن تكون رقمًا موجبًا");
                }
            } else {
                if (!conv.from || !conv.to) {
                    throw new Error(
                        "جميع التحويلات يجب أن تحتوي على وحدات المصدر والهدف"
                    );
                }
                if (isNaN(Number(conv.value)) || Number(conv.value) <= 0) {
                    throw new Error("قيمة التحويل يجب أن تكون رقمًا موجبًا");
                }
            }
        }

        // Check for duplicate barcodes in the request
        const seen = new Set();
        for (const conv of conversions) {
            const barcode = conv.barcode?.trim();
            if (barcode) {
                if (seen.has(barcode)) {
                    throw new Error(
                        `الباركود "${barcode}" مكرر داخل نفس الطلب`
                    );
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
                throw new Error(
                    `الباركود "${duplicateBarcode}" مستخدم من قبل في منتج آخر`
                );
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

        // Step 3: Insert hasVolumes
        try {
            await HasVolume.insertMany(volumeRecords);
        } catch (volumeErr) {
            await Promise.all([
                Product.findByIdAndDelete(newProduct._id),
                HasVolume.deleteMany({ product: newProduct._id }),
            ]);

            if (volumeErr.code === 11000 && volumeErr.writeErrors?.length) {
                const duplicateBarcodeError = volumeErr.writeErrors.find((e) =>
                    e.err?.errmsg?.includes("barcode_1")
                );

                if (duplicateBarcodeError) {
                    const msg = duplicateBarcodeError.err?.errmsg || "";
                    const matched = msg.match(/dup key: { barcode: "(.*?)" }/);
                    const barcode = matched?.[1];
                    throw new Error(
                        barcode
                            ? `الباركود "${barcode}" مستخدم من قبل`
                            : "باركود مكرر مستخدم من قبل"
                    );
                }
            }

            throw volumeErr;
        }

        return newProduct;
    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.name) {
            throw new Error("اسم المنتج موجود بالفعل");
        }
        throw err;
    }
};

// Helper function to generate product conversions
const generateProductConversions = (volumes, productIndex) => {
    const [piece, bag, box, packet] = volumes;

    // Randomly select base volume (always start with base quantity = 1)
    const baseVolumeIndex = Math.floor(Math.random() * 4);
    const baseVolume = volumes[baseVolumeIndex];
    const baseValue = 1; // Base volume always has value 1

    const conversions = [];
    const values = [];
    const volumesInConversions = new Set([baseVolume._id.toString()]);

    // First conversion: base volume with value 1
    // Add barcode to 20-30% of conversions (including base)
    const baseShouldHaveBarcode = Math.random() < 0.25;
    conversions.push({
        from: baseVolume._id.toString(),
        value: baseValue,
        barcode: baseShouldHaveBarcode ? generateBarcode() : undefined,
    });

    // Base value is always 1
    values.push({
        id: baseVolume._id.toString(),
        val: 1,
    });

    // Track current total value for chaining conversions
    let currentTotalValue = 1;
    let previousFromVolumeId = baseVolume._id.toString();

    // Generate 1-3 additional conversions with different patterns
    const numConversions = Math.floor(Math.random() * 3) + 1; // 1-3 conversions

    for (let i = 0; i < numConversions && volumesInConversions.size < 4; i++) {
        // Find available volumes that haven't been used as "from" yet
        const availableVolumes = volumes.filter(
            (v) => !volumesInConversions.has(v._id.toString())
        );

        if (availableVolumes.length === 0) break;

        // Randomly select a "from" volume (must be one we haven't used yet)
        const fromVolume =
            availableVolumes[
                Math.floor(Math.random() * availableVolumes.length)
            ];

        // Use the previous "from" as the current "to" (chaining)
        const toVolumeId = previousFromVolumeId;

        // Generate easy-to-calculate conversion values
        // Use simple multipliers: 2, 3, 4, 5, 6, 8, 10, 12, 20, 24, 30, 50, 100
        const multipliers = [2, 3, 4, 5, 6, 8, 10, 12, 20, 24, 30, 50, 100];
        const conversionValue =
            multipliers[Math.floor(Math.random() * multipliers.length)];

        // Add barcode to 20-30% of conversions (excluding base)
        const shouldAddBarcode = Math.random() < 0.25;

        conversions.push({
            from: fromVolume._id.toString(),
            to: toVolumeId,
            value: conversionValue,
            barcode: shouldAddBarcode ? generateBarcode() : undefined,
        });

        // Calculate value for the new "from" volume: current total * conversion value
        const fromValue = currentTotalValue * conversionValue;
        values.push({
            id: fromVolume._id.toString(),
            val: fromValue,
        });

        // Update tracking variables for next iteration
        currentTotalValue = fromValue;
        previousFromVolumeId = fromVolume._id.toString();
        volumesInConversions.add(fromVolume._id.toString());
    }

    return { conversions, values };
};

const runSeeder = async () => {
    await connectDB();

    try {
        console.log("🌱 Starting product seeding...\n");

        // Step 1: Create volumes using createVolume controller logic
        console.log("📦 Creating volumes...");
        const piece = await createVolume(ARABIC_VOLUMES.piece);
        const bag = await createVolume(ARABIC_VOLUMES.bag);
        const box = await createVolume(ARABIC_VOLUMES.box);
        const packet = await createVolume(ARABIC_VOLUMES.packet);

        const volumes = [piece, bag, box, packet];
        console.log(`✅ Created ${volumes.length} volumes\n`);

        // Step 2: Create 4000 products using createFullProduct controller logic
        console.log("🛍️  Creating 4000 products...");
        const totalProducts = 4000;
        const batchSize = 100;
        let created = 0;
        let errors = 0;

        for (let i = 0; i < totalProducts; i += batchSize) {
            const batch = [];
            const batchEnd = Math.min(i + batchSize, totalProducts);

            for (let j = i; j < batchEnd; j++) {
                try {
                    const productName = generateProductName(j);
                    const minStock = Math.floor(Math.random() * 50) + 10;
                    const { conversions, values } = generateProductConversions(
                        volumes,
                        j
                    );

                    batch.push(
                        createFullProduct({
                            name: productName,
                            minStock,
                            conversions,
                            values,
                        })
                    );
                } catch (err) {
                    console.error(
                        `❌ Error preparing product ${j + 1}:`,
                        err.message
                    );
                    errors++;
                }
            }

            // Execute batch
            const results = await Promise.allSettled(batch);
            results.forEach((result, idx) => {
                if (result.status === "fulfilled") {
                    created++;
                } else {
                    errors++;
                    console.error(
                        `❌ Error creating product ${i + idx + 1}:`,
                        result.reason?.message || result.reason
                    );
                }
            });

            // Progress update
            if ((i + batchSize) % 500 === 0 || i + batchSize >= totalProducts) {
                console.log(
                    `   Progress: ${Math.min(
                        i + batchSize,
                        totalProducts
                    )}/${totalProducts} products processed (${created} created, ${errors} errors)`
                );
            }
        }

        console.log(`\n✅ Seeding completed!`);
        console.log(`   Created: ${created} products`);
        console.log(`   Errors: ${errors} products`);
        console.log(`   Total volumes: ${volumes.length}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

runSeeder();
