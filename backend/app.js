// File: app.js

const express = require("express");
const connectDB = require("./src/db/connect");
const routes = require("./src/routes");

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Base route
app.get("/", (req, res) => res.send("Inventory API is running."));

// Register API routes
app.use("/api", routes);

// Start server
app.listen(5000, () => console.log("Server started on port 5000"));
