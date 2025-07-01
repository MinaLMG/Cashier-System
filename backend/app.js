// File: app.js

const express = require("express");
const connectDB = require("./src/db/connect");

// Load models (for registration)
require("./src/models/User");
require("./src/models/Category");
require("./src/models/Volume");
require("./src/models/Product");
require("./src/models/HasVolume");
require("./src/models/Customer");
require("./src/models/Supplier");
require("./src/models/PurchaseInvoice");
require("./src/models/PurchaseItem");
require("./src/models/SalesInvoice");
require("./src/models/SalesItem");
require("./src/models/Notification");
require("./src/models/Expires");
require("./src/models/GotMinimum");

const app = express();
app.use(express.json());

connectDB();

app.get("/", (req, res) => res.send("Inventory API is running."));

app.listen(3000, () => console.log("Server started on port 3000"));
