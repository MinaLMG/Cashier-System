// File: app.js

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/db/connect");

const routes = require("./src/routes");

const app = express();
app.use(express.json());

const allowedOrigins = [
    "http://localhost:3000",
    "https://cashier-system-6pb1.vercel.app",
];
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// Connect to MongoDB
connectDB();

// Base route
app.get("/", (req, res) => res.send("Intermedical API is running."));

// Register API routes
app.use("/api", routes);

// Start server
app.listen(5000, () => console.log("Server started on port 5000"));
