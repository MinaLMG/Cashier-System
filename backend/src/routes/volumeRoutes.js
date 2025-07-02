const express = require("express");
const router = express.Router();
const volumeController = require("../controllers/volumeController");

router.get("/", volumeController.getAllVolumes);
router.post("/", volumeController.createVolume);
router.delete("/:id", volumeController.deleteVolume);
router.put("/:id", volumeController.updateVolume);

module.exports = router;
