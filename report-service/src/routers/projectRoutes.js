// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\backend\services\report-service\src\routes\projectRoutes.js
const express = require("express");
const projectController = require("../controllers/projectController");

const router = express.Router();

// API để lấy danh sách dự án (products) mà một employee tham gia
// employeeId ở đây là user_id tùy chỉnh (VNU1, VNU2,...)
router.get("/employee/:employeeId", projectController.getProjectsByEmployee);

// API để lấy danh sách components của một dự án cụ thể mà một employee tham gia
router.get(
  "/:productCode/employee/:employeeId/components",
  projectController.getProjectComponentsByEmployee
);

module.exports = router;
