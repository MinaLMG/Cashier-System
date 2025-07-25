const express = require("express");
const router = express.Router();
const controller = require("../controllers/gotMinimumController");

router.get("/", controller.getAllGotMinimums);
router.post("/", controller.createGotMinimum);
router.delete("/:id", controller.deleteGotMinimum);

module.exports = router;
