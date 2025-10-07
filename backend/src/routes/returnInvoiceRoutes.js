const express = require("express");
const router = express.Router();
const returnInvoiceController = require("../controllers/returnInvoiceController");

// Get all return invoices
router.get("/", returnInvoiceController.getAllReturnInvoices);

// Get all return invoices for reports
router.get("/reports", returnInvoiceController.getAllReturnInvoicesForReports);

// Get return invoice by ID
router.get("/:id", returnInvoiceController.getReturnInvoiceById);

// Create return invoice
router.post("/", returnInvoiceController.createReturnInvoice);

// Create return invoice directly from invoice data
router.post(
    "/from-invoice",
    returnInvoiceController.createReturnInvoiceFromInvoice
);

// Delete return invoice
router.delete("/:id", returnInvoiceController.deleteReturnInvoice);

module.exports = router;
