const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {getReportsByProductId, submitReport, scanBarcodeFromImage, getAllReports,deleteReport,deleteReportbyProductId } = require('../services/reportService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/temp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// Get all reports
const getReports = (req, res) => {
  const reports = getAllReports();
  res.json({ success: true, reports });
};

const getReportsById = async (req, res) => {
  try {
    const { productId } = req.params;

    const reports = await getReportsByProductId(productId);

    if (!reports.length) {
      return res.status(404).json({ message: 'No reports found for this product' });
    }

    res.json(reports);
  } catch (error) {
    console.error('Error in controller:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Scan barcode from uploaded image
const scanBarcode = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  
  try {
    const imagePath = req.file.path;
    const scanResult = await scanBarcodeFromImage(imagePath);
    
    // Clean up temporary file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.status(200).json(scanResult);
  } catch (error) {
    console.error('Error processing scan request:', error);
    res.status(500).json({ success: false, message: 'Server error processing the image' });
  }
};

// Scan and submit report in one request
const scanAndReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  
  const { reportText } = req.body;
  
  if (!reportText) {
    return res.status(400).json({ success: false, message: 'Report text is required' });
  }
  
  try {
    const imagePath = req.file.path;
    const scanResult = await scanBarcodeFromImage(imagePath);
    
    // Clean up temporary file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    const barcode = scanResult;
    const reportResult = submitReport(barcode, reportText);
        
    res.status(200).json({
      success: true,
      message: 'Barcode scanned and report submitted successfully',
      barcode,
      report: reportResult.report
    });
  } catch (error) {
    console.error('Error processing scan and report request:', error);
    res.status(500).json({ success: false, message: 'Server error processing the request' });
  }
};

const deleteOneReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await deleteReport(reportId);

    return res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteReportOfProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await deleteReportbyProductId(productId);
    return res.status(200).json({ success: true, message: 'Reports for product deleted successfully' });
  }  
   catch (error) {
    console.error('Error deleting reports for product:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  getReportsById,
  getReports,
  scanBarcode,
  scanAndReport,
  deleteOneReport,
  deleteReportOfProduct,
  upload
};