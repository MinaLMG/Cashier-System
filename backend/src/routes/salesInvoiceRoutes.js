const express = require("express");
const router = express.Router();
const controller = require("../controllers/salesInvoiceController");

// Used routes
router.post("/full", controller.createFullSalesInvoice);
router.get("/full", controller.getFullSalesInvoices);
router.get(
    "/available-return-volumes-for-invoice-item/:salesItemId",
    controller.getAvailableReturnVolumesForInvoiceItem
);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.get("/", controller.getAllSalesInvoices);
// router.post("/", controller.createSalesInvoice);
// router.put("/:id", controller.updateSalesInvoice);
// router.delete("/:id", controller.deleteSalesInvoice);
// router.get(
//     "/available-return-volumes/:salesItemId",
//     controller.getAvailableReturnVolumes
// );

module.exports = router;
