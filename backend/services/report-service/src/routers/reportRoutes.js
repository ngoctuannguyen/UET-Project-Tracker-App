const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Routes
router.get('/reports', reportController.getReports);
router.get('/reports/:productId', reportController.getReportsById);
router.post('/scan', reportController.upload.single('image'), reportController.scanBarcode);
router.post('/scan-and-report', reportController.upload.single('image'), reportController.scanAndReport);
router.delete('/reports/:reportId', reportController.deleteOneReport);
router.delete('/reports/product/:productId', reportController.deleteReportOfProduct);
module.exports = router;