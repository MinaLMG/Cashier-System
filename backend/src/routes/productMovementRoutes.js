const express = require("express");
const router = express.Router();
const {
    getProductMovement,
} = require("../controllers/productMovementController");
const auth = require("../middleware/auth");

// Get product movement history
router.get("/:productId", auth, getProductMovement);

module.exports = router;
