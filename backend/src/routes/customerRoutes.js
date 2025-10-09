const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/", customerController.getAllCustomers);
router.post("/", customerController.createCustomer);
// Customer deletion route disabled
// router.delete("/:id", customerController.deleteCustomer);
router.put("/:id", customerController.updateCustomer);

module.exports = router;
