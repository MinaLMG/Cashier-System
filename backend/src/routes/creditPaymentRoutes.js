const express = require("express");
const router = express.Router();
const creditPaymentController = require("../controllers/creditPaymentController");

router.post("/", creditPaymentController.createCreditPayment);
router.get("/", creditPaymentController.getAllCreditPayments);
router.put("/:id", creditPaymentController.updateCreditPayment);
router.delete("/:id", creditPaymentController.deleteCreditPayment);
router.get("/customer/:customerId", creditPaymentController.getPaymentsByCustomer);

module.exports = router;
