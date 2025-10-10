const express = require("express");
const router = express.Router();
const hasVolumeController = require("../controllers/hasVolumeController");

// Used routes
router.get("/barcode/:barcode", hasVolumeController.findByBarcode);

// New route to get barcode by product and volume
router.get(
    "/product/:productId/volume/:volumeId/barcode",
    hasVolumeController.findBarcodeByProductAndVolume
);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.get("/", hasVolumeController.getAllHasVolumes);
// router.post("/", hasVolumeController.createHasVolume);
// router.put("/:id", hasVolumeController.updateHasVolume);
// router.delete("/:id", hasVolumeController.deleteHasVolume);

module.exports = router;
