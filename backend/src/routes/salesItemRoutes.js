const express = require("express");
const router = express.Router();
const controller = require("../controllers/salesItemController");

// Enable the GET endpoint for fetching sales items (needed for return functionality)
router.get("/", controller.getAllSalesItems);

// Other endpoints remain commented out as they're not currently used
// router.post("/", controller.createSalesItem);
// router.put("/:id", controller.updateSalesItem);
// router.delete("/:id", controller.deleteSalesItem);

module.exports = router;
