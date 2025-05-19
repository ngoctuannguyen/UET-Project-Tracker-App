const barcodeService = require("./scanBarcode");
const { Report, Product, Component } = require("../models"); // Removed Employee as it's not used here, ensure Component is present
// const product = require('../models/product'); // This line seems redundant if Product is imported from models

const getReportsByComponentId = async (componentCode) => {
  try {
    const reports = await Report.findAll({
      where: { componentCode },
    });
    return reports;
  } catch (error) {
    console.error("Error fetching reports by productId:", error);
    throw new Error("Database error");
  }
};

const deleteReport = async (reportId) => {
  try {
    const report = await Report.findByPk(reportId);
    if (!report) return { success: false, message: "Report not found" };

    await report.destroy();
    return { success: true };
  } catch (error) {
    console.error("Error deleting report:", error);
    return { success: false, message: error.message };
  }
};

const deleteReportbyComponentId = async (componentCode) => {
  try {
    const report = await Report.findAll({
      where: { componentCode },
    });
    if (!report) return { success: false, message: "Report not found" };

    await report.destroy();
    return { success: true };
  } catch (error) {
    console.error("Error deleting report:", error);
    return { success: false, message: error.message };
  }
};
// Gửi báo cáo
async function submitReport(componentCode, content, employeeIdInput) {
  // Đổi tên tham số để rõ ràng hơn
  try {
    // Tìm Component theo componentCode
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) {
      return { success: false, message: "Component not found" };
    }

    // Sử dụng employeeIdInput nếu nó là một số hợp lệ, ngược lại dùng 1
    // Hoặc đơn giản là luôn dùng 1 cho mục đích test hiện tại
    const finalEmployeeId = 1; // <<< THAY ĐỔI: Luôn sử dụng 1 cho employeeId

    // Tạo báo cáo mới
    const newReport = await Report.create({
      content,
      employeeId: finalEmployeeId, // Sử dụng giá trị đã quyết định
      componentCode: component.componentCode,
      reportAt: new Date(),
    });

    if (component.is_completed !== 1 && component.is_completed !== true) {
      component.is_completed = 1;
      await component.save();
      console.log(`Component ${componentCode} status updated to completed.`);
    }

    return {
      success: true,
      report: newReport,
    };
  } catch (error) {
    console.error("Error submitting report and updating component:", error);
    // Trả về thông điệp lỗi cụ thể từ DB nếu có
    const dbErrorMessage = error.original?.sqlMessage || error.message;
    return {
      success: false,
      message: "Error submitting report: " + dbErrorMessage,
    };
  }
}

// Gọi API nhận diện ảnh để lấy mã barcode
const scanBarcodeFromImage = async (imagePath) => {
  try {
    // Giả sử barcodeService.scanBarcode trả về chuỗi barcode nếu thành công,
    // hoặc null/undefined/throw error nếu thất bại.
    const decodedBarcode = await barcodeService.scanBarcode(imagePath); // Đây là hàm bạn cần kiểm tra

    if (
      decodedBarcode &&
      typeof decodedBarcode === "string" &&
      decodedBarcode.length > 0
    ) {
      // Nếu thư viện zxing log ra "✅ Barcode decoded: 5400141358582"
      // thì có khả năng decodedBarcode ở đây chính là chuỗi "5400141358582"
      console.log(
        `[reportService] scanBarcodeFromImage successful, barcode: ${decodedBarcode}`
      );
      return { success: true, barcode: decodedBarcode };
    } else {
      // Trường hợp thư viện không trả về barcode hợp lệ hoặc trả về cấu trúc khác
      console.warn(
        `[reportService] scanBarcodeFromImage did not return a valid barcode string. Received:`,
        decodedBarcode
      );
      return {
        success: false,
        message: "Barcode not found by service or invalid format.",
      };
    }
  } catch (error) {
    console.error(
      "[reportService] Error in scanBarcodeFromImage calling barcodeService:",
      error
    );
    // Kiểm tra xem lỗi có chứa thông điệp cụ thể từ thư viện quét không
    const errorMessage =
      error.message ||
      "Failed to scan barcode due to an internal error in service.";
    return { success: false, message: errorMessage };
  }
};

const updateStatus = async (componentCode, status) => {
  try {
    // Tìm component theo componentCode
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) return { success: false, message: "Component not found" };
    // Cập nhật trạng thái
    if (status === "completed") {
      component.is_completed = 1;
    }
    await component.save();
    return { success: true, message: "Component status updated successfully" };
  } catch (error) {
    console.error("Error updating component status:", error);
    return { success: false, message: error.message };
  }
};

const updateProgress = async (componentCode) => {
  try {
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) {
      console.error(`updateProgress: Component ${componentCode} not found.`);
      return {
        success: false,
        message: "Component not found for progress update.",
      };
    }

    const productCode = component.productCode;
    if (!productCode) {
      console.error(
        `updateProgress: Component ${componentCode} does not have a productCode.`
      );
      return {
        success: false,
        message: "Component does not have a productCode.",
      };
    }

    const allComponents = await Component.findAll({ where: { productCode } });
    const total = allComponents.length;

    if (total === 0) {
      console.error(
        `updateProgress: No components found for product ${productCode}.`
      );
      return { success: true, progress: 0 };
    }

    const completedCount = allComponents.filter(
      (c) => c.is_completed === 1 || c.is_completed === true
    ).length;
    console.log(
      `Total components for product ${productCode}: ${total}, Completed components: ${completedCount}`
    );
    const progress = Math.round((completedCount / total) * 100);

    const product = await Product.findOne({ where: { productCode } });
    if (!product) {
      console.error(`updateProgress: Product ${productCode} not found.`);
      return {
        success: false,
        message: "Product not found for progress update.",
      };
    }

    await product.update({ progress: progress.toString() });

    console.log(`Progress for product ${productCode} updated to ${progress}%`);
    return { success: true, progress };
  } catch (error) {
    console.error("Error updating progress:", error.message);
    return {
      success: false,
      message: "Error updating progress: " + error.message,
    };
  }
};

// Hàm mới để lấy chi tiết component và product dựa trên barcode
const getComponentDetailsByBarcode = async (componentCode) => {
  try {
    const component = await Component.findOne({
      where: { componentCode },
      include: [
        {
          model: Product,
          attributes: ["productCode", "name"], // Chỉ lấy các trường cần thiết từ Product
          required: true, // Đảm bảo rằng component phải thuộc về một product
        },
      ],
      attributes: ["componentCode", "name", "productCode"], // Lấy các trường cần thiết từ Component
    });

    if (!component) {
      return {
        success: false,
        message: "Component not found or not associated with a product.",
      };
    }

    // Trả về dữ liệu có cấu trúc rõ ràng
    return {
      success: true,
      details: {
        componentCode: component.componentCode,
        componentName: component.name,
        productCode: component.Product.productCode, // Dữ liệu Product nằm trong component.Product do include
        productName: component.Product.name,
      },
    };
  } catch (error) {
    console.error("Error fetching component details by barcode:", error);
    return {
      success: false,
      message: "Error fetching component details: " + error.message,
    };
  }
};

module.exports = {
  submitReport,
  scanBarcodeFromImage,
  getReportsByComponentId,
  deleteReport,
  deleteReportbyComponentId,
  updateProgress, // Giữ lại nếu cần ở nơi khác
  updateStatus,
  getComponentDetailsByBarcode,
};
