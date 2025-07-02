const express = require("express");
const router = express.Router();
const invoiceBuyController = require("../controllers/invoiceBuyController");

router.get("/", invoiceBuyController.getAllInvoiceBuys);
router.post("/", invoiceBuyController.createInvoiceBuy);
router.put("/:id", invoiceBuyController.updateInvoiceBuy);
router.delete("/:id", invoiceBuyController.deleteInvoiceBuy);

module.exports = router;
