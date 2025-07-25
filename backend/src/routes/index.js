const express = require("express");
const router = express.Router();

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
router.use("/has-volumes", require("./hasVolumeRoutes"));
router.use("/expires", require("./expiresRoutes"));
router.use("/got-minimums", require("./gotMinimumRoutes"));

module.exports = router;
