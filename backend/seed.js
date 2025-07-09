// File: seed.js

const mongoose = require("mongoose");
const connectDB = require("./src/db/connect");

// Load models
const Volume = require("./src/models/Volume");
const Category = require("./src/models/Category");
const Customer = require("./src/models/Customer");
const Supplier = require("./src/models/Supplier");

const runSeeder = async () => {
    await connectDB();

    try {
        // Clear existing data (optional)
        await Promise.all([
            Volume.deleteMany({}),
            Category.deleteMany({}),
            Customer.deleteMany({}),
            Supplier.deleteMany({}),
        ]);

        // Volumes
        const volumes = await Volume.insertMany([
            { name: "Box" },
            { name: "Bottle" },
            { name: "Strip" },
            { name: "Pack" },
            { name: "الاساس" },
        ]);

        // Categories
        const categories = await Category.insertMany([
            { name: "Antibiotics" },
            { name: "Painkillers" },
            { name: "Supplements" },
            { name: "Dermatology" },
        ]);

        // Customers
        const customers = await Customer.insertMany([
            { name: "Ali Pharmacy", type: "pharmacy", phone: "0100000001" },
            { name: "Walkin Customer", type: "walkin", phone: "" },
        ]);

        // Suppliers
        const suppliers = await Supplier.insertMany([
            { name: "Pharma Distributor", phone: "0111111111" },
            { name: "Medical Co", phone: "0122222222" },
        ]);

        console.log("✅ Seeding completed.");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

runSeeder();
