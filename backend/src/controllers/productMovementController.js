const Product = require("../models/Product");
const PurchaseItem = require("../models/PurchaseItem");
const SalesItem = require("../models/SalesItem");
const ReturnItem = require("../models/ReturnItem");
const PurchaseInvoice = require("../models/PurchaseInvoice");
const SalesInvoice = require("../models/SalesInvoice");
const HasVolume = require("../models/HasVolume");
const ReturnInvoice = require("../models/ReturnInvoice");

// Get product movement history
const getProductMovement = async (req, res) => {
    try {
        console.log("getProductMovement");
        const { productId } = req.params;
        console.log("productId", productId);
        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        console.log("product", product);
        const movements = [];

        // Get all purchase items for this product
        const purchaseItems = await PurchaseItem.find({ product: productId })
            .populate("purchase_invoice", "date")
            .sort({ createdAt: 1 });

        // Get all sales items for this product
        const salesItems = await SalesItem.find({ product: productId })
            .populate("sales_invoice", "date")
            .sort({ createdAt: 1 });
        console.log("salesItems", salesItems);
        // Get all return items for this product
        const returnItems = await ReturnItem.find({ product: productId })
            .populate("return_invoice", "date")
            .sort({ createdAt: 1 });

        // Get all volume conversions for this product
        const hasVolumes = await HasVolume.find({ product: productId });
        const volumeMap = new Map();
        hasVolumes.forEach((hv) => {
            volumeMap.set(hv.volume.toString(), hv.value);
        });

        // Process purchase items
        purchaseItems.forEach((item) => {
            const volumeValue = volumeMap.get(item.volume.toString()) || 1;
            const quantityInBaseUnits = item.quantity * volumeValue;
            const remainingInBaseUnits = item.remaining * volumeValue;

            movements.push({
                date: item.purchase_invoice.date,
                type: "purchase",
                quantity: quantityInBaseUnits,
                remaining: remainingInBaseUnits,
                createdAt: item.createdAt,
                priority: 1, // Purchase has highest priority
            });
        });
        console.log("purchaseItems", purchaseItems);

        // Process sales items
        salesItems.forEach((item) => {
            const volumeValue = volumeMap.get(item.volume.toString()) || 1;
            const quantityInBaseUnits = item.quantity * volumeValue;

            movements.push({
                date: item.sales_invoice.date,
                type: "sale",
                quantity: quantityInBaseUnits,
                remaining: null, // Sales don't have remaining field
                createdAt: item.createdAt,
                priority: 2, // Sales have lower priority than purchases
            });
        });
        console.log("returnItems", returnItems);

        // Process return items
        returnItems.forEach((item) => {
            const volumeValue = volumeMap.get(item.volume.toString()) || 1;
            const quantityInBaseUnits = item.quantity * volumeValue;

            movements.push({
                date: item.return_invoice.date,
                type: "return",
                quantity: quantityInBaseUnits,
                remaining: null, // Returns don't have remaining field
                createdAt: item.createdAt,
                priority: 3, // Returns have lowest priority
            });
        });

        // Sort movements chronologically with priority rules
        movements.sort((a, b) => {
            // First sort by date
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }

            // If same date, sort by priority (purchase > sale > return)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            // If same date and same type, sort by createdAt
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        console.log("movements", movements);
        // Calculate remaining quantities chronologically
        let currentRemaining = 0;
        movements.forEach((movement) => {
            if (movement.type === "purchase") {
                currentRemaining += movement.quantity;
                movement.remaining = currentRemaining;
            } else if (movement.type === "sale") {
                currentRemaining -= movement.quantity;
                movement.remaining = currentRemaining;
            } else if (movement.type === "return") {
                currentRemaining += movement.quantity;
                movement.remaining = currentRemaining;
            }
        });

        // Format dates and remove internal fields, add row numbers
        const formattedMovements = movements.map((movement, index) => ({
            rowNumber: index + 1,
            date: movement.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
            type: movement.type,
            quantity: movement.quantity,
            remaining: movement.remaining,
        }));
        console.log("formattedMovements", formattedMovements);
        res.json(formattedMovements);
    } catch (error) {
        console.error("Error getting product movement:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getProductMovement,
};
