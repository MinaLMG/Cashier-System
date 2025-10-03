const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const connectDB = require("../db/connect");

const seedUsers = async () => {
    try {
        await connectDB();

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: "admin" });

        if (existingAdmin) {
            console.log("Admin user already exists");
            return;
        }

        // Create default admin user
        const adminUser = new User({
            username: "admin",
            name: "المدير العام",
            password: "admin123", // This will be hashed automatically
            role: "admin",
        });

        await adminUser.save();
        console.log("Admin user created successfully");
        console.log("Username: admin");
        console.log("Password: admin123");

        // Create a sample seller user
        const sellerUser = new User({
            username: "seller",
            name: "البائع",
            password: "seller123",
            role: "seller",
        });

        await sellerUser.save();
        console.log("Seller user created successfully");
        console.log("Username: seller");
        console.log("Password: seller123");
    } catch (error) {
        console.error("Error seeding users:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seed function
seedUsers();
