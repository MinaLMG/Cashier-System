const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

router.get("/", supplierController.getAllSuppliers);
router.post("/", supplierController.createSupplier);
router.delete("/:id", supplierController.deleteSupplier);
router.put("/:id", supplierController.updateSupplier);

module.exports = router;
