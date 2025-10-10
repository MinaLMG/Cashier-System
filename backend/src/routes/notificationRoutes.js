const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getAllNotifications);
router.post(
    "/refresh-minimum",
    notificationController.refreshMinimumNotifications
);
router.post(
    "/refresh-expiry",
    notificationController.refreshExpiryNotifications
);
router.post("/", notificationController.createNotification);
router.put("/:id", notificationController.updateNotification);
// router.delete("/:id", notificationController.deleteNotification); // COMMENTED OUT

module.exports = router;
