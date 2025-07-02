const express = require("express");
const router = express.Router();
const invoiceSellController = require("../controllers/invoiceSellController");

router.get("/", invoiceSellController.getAllInvoiceSells);
router.post("/", invoiceSellController.createInvoiceSell);
router.put("/:id", invoiceSellController.updateInvoiceSell);
router.delete("/:id", invoiceSellController.deleteInvoiceSell);

module.exports = router;
