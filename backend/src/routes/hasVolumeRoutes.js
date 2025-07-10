const express = require("express");
const router = express.Router();
const controller = require("../controllers/hasVolumeController");

// Existing routes
router.get("/", controller.getAllHasVolumes);
router.post("/", controller.createHasVolume);
// Add new route for barcode lookup
router.get("/barcode/:barcode", controller.findByBarcode);

module.exports = router;
