const express = require("express");
const router = express.Router();
const controller = require("../controllers/expiresController");

// UNUSED ENDPOINTS - COMMENTED OUT
// router.get("/", controller.getAllExpires);
// router.post("/", controller.createExpires);
// router.delete("/:id", controller.deleteExpires);

module.exports = router;
