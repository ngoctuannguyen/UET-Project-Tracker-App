const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Điều chỉnh dòng import để phù hợp với các hàm được export từ service và thêm hàm mới
const {
  submitReport,
  scanBarcodeFromImage,
  deleteReport,
  deleteReportbyComponentId,
  getReportsByComponentId,
  getComponentDetailsByBarcode,
} = require("../services/reportService");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/temp";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const getReportsById = async (req, res) => {
  try {
    const { componentCode } = req.params;

    const reports = await getReportsByComponentId(componentCode);

    if (!reports.length) {
      return res
        .status(404)
        .json({ message: "No reports found for this product" });
    }

    res.json(reports);
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Scan barcode from uploaded image
const scanBarcode = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file uploaded" });
  }

  try {
    const imagePath = req.file.path;
    const scanResult = await scanBarcodeFromImage(imagePath);

    // Clean up temporary file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temporary file:", err);
    });

    res.status(200).json(scanResult);
  } catch (error) {
    console.error("Error processing scan request:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error processing the image" });
  }
};

// Scan and submit report in one request
const scanAndReport = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file uploaded" });
  }

  const { reportText } = req.body;

  if (!reportText) {
    return res
      .status(400)
      .json({ success: false, message: "Report text is required" });
  }

  try {
    const imagePath = req.file.path;
    const scanResult = await scanBarcodeFromImage(imagePath);

    // Clean up temporary file after processing
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temporary file:", err);
    });

    const barcode = scanResult;
    const reportResult = submitReport(barcode, reportText);
    res.status(200).json({
      success: true,
      message: "Barcode scanned and report submitted successfully",
      barcode,
      report: reportResult.report,
    });
  } catch (error) {
    console.error("Error processing scan and report request:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error processing the request" });
  }
};

const deleteOneReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await deleteReport(reportId);

    return res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteReportOfComponent = async (req, res) => {
  try {
    const { componentCode } = req.params;
    const result = await deleteReportbyComponentId(componentCode);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      message: "Reports for product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting reports for product:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const submitReportNormal = async (req, res) => {
  const { barcode, reportText, employeeId } = req.body; // employeeId từ frontend sẽ được service bỏ qua

  if (!barcode || !reportText) {
    return res.status(400).json({
      success: false,
      message: "Barcode and report text are required",
    });
  }

  try {
    // Service sẽ sử dụng employeeId = 1 bất kể giá trị employeeId truyền vào ở đây
    const result = await submitReport(barcode, reportText, employeeId);
    if (!result.success) {
      // Service đã trả về message lỗi cụ thể
      return res.status(400).json({ success: false, message: result.message });
    }
    res.status(201).json({
      success: true,
      message: "Report submitted and component status updated successfully",
      report: result.report,
    });
  } catch (error) {
    // Lỗi này thường là lỗi không mong muốn trong controller
    console.error("Unexpected error in submitReportNormal controller:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error submitting the report" });
  }
};

// <<< THÊM CONTROLLER MỚI >>>
// Scan barcode from image and get component details
const scanAndGetDetails = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file uploaded" });
  }

  try {
    const imagePath = req.file.path;
    const scanResult = await scanBarcodeFromImage(imagePath);

    // <<< THÊM LOG NÀY ĐỂ DEBUG >>>
    console.log(
      "[reportController] scanAndGetDetails - scanResult from service:",
      JSON.stringify(scanResult, null, 2)
    );

    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temporary file:", err);
    });

    if (!scanResult || !scanResult.success || !scanResult.barcode) {
      console.warn(
        "[reportController] scanAndGetDetails - Scan was not successful or barcode missing."
      );
      return res.status(404).json({
        success: false,
        message: scanResult?.message || "Barcode not found or scan failed.",
      });
    }

    const componentCode = scanResult.barcode;

    // Bước 2: Lấy chi tiết component dựa trên barcode quét được
    const componentDetailsResult = await getComponentDetailsByBarcode(
      componentCode
    );

    if (!componentDetailsResult.success) {
      return res.status(404).json({
        success: false,
        message:
          componentDetailsResult.message ||
          "Component details not found for the scanned barcode.",
        barcode: componentCode, // Trả về barcode ngay cả khi không có chi tiết
      });
    }

    // Trả về cả barcode và chi tiết component
    res.status(200).json({
      success: true,
      barcode: componentCode,
      componentDetails: componentDetailsResult.details,
    });
  } catch (error) {
    console.error("Error processing scan and get details request:", error);
    // Xóa file tạm nếu có lỗi xảy ra trước khi fs.unlink được gọi
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temporary file on error:", err);
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error processing the image and fetching details",
    });
  }
};

// <<< THÊM: Controller mới để xử lý yêu cầu lấy chi tiết component >>>
const getComponentDetails = async (req, res) => {
  try {
    const { componentCode } = req.params;
    if (!componentCode) {
      return res
        .status(400)
        .json({ success: false, message: "Component code is required." });
    }

    // Gọi service function đã được import bằng destructuring
    const result = await getComponentDetailsByBarcode(componentCode);

    if (!result.success) {
      // Trả về 404 nếu không tìm thấy hoặc có lỗi từ service
      return res.status(404).json({
        success: false,
        message: result.message || "Component details not found.",
      });
    }

    // Trả về kết quả thành công cùng với dữ liệu chi tiết
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getComponentDetails controller:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getReportsById,
  scanBarcode,
  scanAndReport,
  deleteOneReport,
  deleteReportOfComponent,
  submitReportNormal,
  upload,
  getComponentDetails,
  scanAndGetDetails, // <<< THÊM: Export controller mới
};
