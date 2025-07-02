const express = require("express");
const router = express.Router();
const controller = require("../controllers/expiresController");

router.get("/", controller.getAllExpires);
router.post("/", controller.createExpires);
router.delete("/:id", controller.deleteExpires);

module.exports = router;
