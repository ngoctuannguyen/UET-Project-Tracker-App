const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Routes
router.get("/reports/:componentCode", reportController.getReportsById);
router.post(
  "/scan",
  reportController.upload.single("image"),
  reportController.scanBarcode
);
router.post(
  "/scan-details",
  reportController.upload.single("image"),
  reportController.scanAndGetDetails
);
router.post(
  "/scan-and-report",
  reportController.upload.single("image"),
  reportController.scanAndReport
);
router.delete("/reports/:reportId", reportController.deleteOneReport);
router.delete(
  "/reports/product/:componentCode",
  reportController.deleteReportOfComponent
);
router.post("/submit-report", reportController.submitReportNormal);
router.get(
  "/component-details/:componentCode",
  reportController.getComponentDetails
);

module.exports = router;
