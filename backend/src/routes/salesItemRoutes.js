const express = require("express");
const router = express.Router();
const controller = require("../controllers/salesItemController");

router.get("/", controller.getAllSalesItems);
router.post("/", controller.createSalesItem);
router.put("/:id", controller.updateSalesItem);
router.delete("/:id", controller.deleteSalesItem);

module.exports = router;
