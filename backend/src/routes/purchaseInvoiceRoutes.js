const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseInvoiceController");

router.get("/", controller.getAllPurchaseInvoices);
router.post("/", controller.createPurchaseInvoice);
router.put("/:id", controller.updatePurchaseInvoice);
router.delete("/:id", controller.deletePurchaseInvoice);

module.exports = router;
