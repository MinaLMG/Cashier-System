const express = require("express");
const router = express.Router();

router.use("/volumes", require("./volumeRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/users", require("./userRoutes"));
router.use("/customers", require("./customerRoutes"));
router.use("/suppliers", require("./supplierRoutes"));

module.exports = router;
