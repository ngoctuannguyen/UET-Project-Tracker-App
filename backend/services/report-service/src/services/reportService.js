
const barcodeService = require('./scanBarcode');
const { Report, Product, Employee,Component } = require('../models');
const product = require('../models/product');


const getReportsByProductId = async (productCode) => {
  try {
    const reports = await Report.findAll({
      where: { productCode },
    });
    return reports;
  } catch (error) {
    console.error('Error fetching reports by productId:', error);
    throw new Error('Database error');
  }
};

const getAllReports = async () => {
  try {
    const reports = await Report.findAll();
    return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw new Error('Database error');
  }
}

const deleteReport = async (reportId) => {
  try {
    const report = await Report.findByPk(reportId);
    if (!report) return { success: false, message: 'Report not found' };

    await report.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, message: error.message };
  }
}

const deleteReportbyProductId = async (productId) => {
  try {
    const report = await Report.findAll({
      where: { productId },
    });
    if (!report) return { success: false, message: 'Report not found' };

    await report.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, message: error.message };
  }
}
// Gửi báo cáo
//TODO: Thêm thông tin Employee vào báo cáo
async function submitReport(componentCode, content) {
  let flag = 0;
  try {
    // Tìm Component theo componentCode
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) return { success: false, message: 'Component not found' };

    // Kiểm tra xem Component đã có Report trước đó chưa
    const existingReport = await Report.findOne({ where: { componentCode } });
    if (existingReport) {
      flag = 1;
    }
    let productCode = component.productCode;
    // Tạo báo cáo mới
    const newReport = await Report.create({
      content,
      employeeId: 1,
      componentCode: component.componentCode,
      productCode: component.productCode,
    });
    
    if (flag === 0) {
      const product = await Product.findOne({ where: { productCode } });
      if (!product) return { success: false, message: 'Product not found' };
      await Product.update(
        { currentProgress: product.currentProgress + component.progress },
        { where: { productCode } }
      );
    }

    // Cập nhật currentProgress trong Product
    return {
      success: true,
      report: newReport
    };
  } catch (error) {
    console.error('Error submitting report:', error);
    return { success: false, message: error.message };
  }
}


// Gọi API nhận diện ảnh để lấy mã barcode
const scanBarcodeFromImage = async (imagePath) => {
  try {
   const response = await barcodeService.scanBarcode(imagePath);
    return response;
  } catch (error) {
    console.error('Error scanning barcode:', error);
    return { success: false, message: 'Failed to scan barcode' };
  }
};

module.exports = {submitReport, scanBarcodeFromImage,getReportsByProductId,getAllReports,deleteReport,deleteReportbyProductId};
