const express = require("express");
const router = express.Router();
const hasVolumeController = require("../controllers/hasVolumeController");

// Existing routes
router.get("/", hasVolumeController.getAllHasVolumes);
router.post("/", hasVolumeController.createHasVolume);
router.put("/:id", hasVolumeController.updateHasVolume);
router.delete("/:id", hasVolumeController.deleteHasVolume);
router.get("/barcode/:barcode", hasVolumeController.findByBarcode);

// New route to get barcode by product and volume
router.get(
    "/product/:productId/volume/:volumeId/barcode",
    hasVolumeController.findBarcodeByProductAndVolume
);

module.exports = router;
