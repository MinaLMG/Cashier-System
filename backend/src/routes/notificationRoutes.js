const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Used routes
router.get("/", notificationController.getAllNotifications);
router.post(
    "/refresh-minimum",
    notificationController.refreshMinimumNotifications
);
router.post(
    "/refresh-expiry",
    notificationController.refreshExpiryNotifications
);
router.put("/:id", notificationController.updateNotification);

// UNUSED ENDPOINTS - COMMENTED OUT
// router.post("/", notificationController.createNotification);
// router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
