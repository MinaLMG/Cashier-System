const express = require("express");
const router = express.Router();
const controller = require("../controllers/salesInvoiceController");

router.get("/", controller.getAllSalesInvoices);
router.post("/", controller.createSalesInvoice);
router.put("/:id", controller.updateSalesInvoice);
router.delete("/:id", controller.deleteSalesInvoice);

module.exports = router;
