const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseInvoiceController");

router.get("/", controller.getAllPurchaseInvoices);
router.post("/", controller.createPurchaseInvoice);
router.put("/:id", controller.updatePurchaseInvoice);
router.delete("/:id", controller.deletePurchaseInvoice);
router.post("/full", controller.createFullPurchaseInvoice);
router.put("/full/:id", controller.updateFullPurchaseInvoice);
router.get("/full", controller.getAllFullPurchaseInvoices);
router.get("/full/:id", controller.getFullPurchaseInvoiceById);

module.exports = router;
