const express = require("express");
const router = express.Router();
const controller = require("../controllers/purchaseItemController");

router.get("/", controller.getAllPurchaseItems);
router.post("/", controller.createPurchaseItem);
router.put("/:id", controller.updatePurchaseItem);
router.delete("/:id", controller.deletePurchaseItem);

module.exports = router;
