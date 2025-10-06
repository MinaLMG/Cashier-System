const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/volumes", require("./volumeRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/customers", require("./customerRoutes"));
router.use("/suppliers", require("./supplierRoutes"));
router.use("/products", require("./productRoutes"));
router.use("/notifications", require("./notificationRoutes"));
router.use("/purchase-invoices", require("./purchaseInvoiceRoutes"));
router.use("/sales-invoices", require("./salesInvoiceRoutes"));
router.use("/sales-items", require("./salesItemRoutes"));
router.use("/purchase-items", require("./purchaseItemRoutes"));
router.use("/return-invoices", require("./returnInvoiceRoutes"));
router.use("/has-volumes", require("./hasVolumeRoutes"));
router.use("/expires", require("./expiresRoutes"));
router.use("/got-minimums", require("./gotMinimumRoutes"));
router.use("/product-movements", require("./productMovementRoutes"));

module.exports = router;
