const express = require("express");
const router = express.Router();
const notificationController = require("../controller/controller");

// Notification routes
router.get("/notifications", notificationController.getNotifications);

module.exports = router;