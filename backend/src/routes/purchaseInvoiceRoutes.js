const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseInvoiceController");

// Used routes
router.post("/full", controller.createFullPurchaseInvoice);
router.put("/full/:id", controller.updateFullPurchaseInvoice);
router.get("/full", controller.getAllFullPurchaseInvoices);
router.get("/full/:id", controller.getFullPurchaseInvoiceById);
router.get(
    "/price-suggestions/:productId/:volumeId",
    controller.getPriceSuggestions
);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.get("/", controller.getAllPurchaseInvoices);
// router.post("/", controller.createPurchaseInvoice);
// router.put("/:id", controller.updatePurchaseInvoice);
// router.delete("/:id", controller.deletePurchaseInvoice);

module.exports = router;
