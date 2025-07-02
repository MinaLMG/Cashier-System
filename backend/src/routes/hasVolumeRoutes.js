const express = require("express");
const router = express.Router();
const controller = require("../controllers/hasVolumeController");

router.get("/", controller.getAllHasVolumes);
router.post("/", controller.createHasVolume);
router.put("/:id", controller.updateHasVolume);
router.delete("/:id", controller.deleteHasVolume);

module.exports = router;
