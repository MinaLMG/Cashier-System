const express = require("express");
const router = express.Router();
const returnInvoiceController = require("../controllers/returnInvoiceController");

// Used routes
router.get("/reports", returnInvoiceController.getAllReturnInvoicesForReports);
router.get("/full", returnInvoiceController.getAllReturnInvoicesFull);
router.get("/sales/:id", returnInvoiceController.getReturnsBySalesInvoiceId);
router.post(
    "/from-invoice",
    returnInvoiceController.createReturnInvoiceFromInvoice
);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.get("/", returnInvoiceController.getAllReturnInvoices);
// router.get("/:id", returnInvoiceController.getReturnInvoiceById);
// router.post("/", returnInvoiceController.createReturnInvoice);
// router.delete("/:id", returnInvoiceController.deleteReturnInvoice);

module.exports = router;
