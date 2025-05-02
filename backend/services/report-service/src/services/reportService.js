
const barcodeService = require('./scanBarcode');
const { Report, Product, Employee,Component } = require('../models');
const product = require('../models/product');


const getReportsByComponentId = async (componentCode) => {
  try {
    const reports = await Report.findAll({
      where: {componentCode},
    });
    return reports;
  } catch (error) {
    console.error('Error fetching reports by productId:', error);
    throw new Error('Database error');
  }
};


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

const deleteReportbyComponentId = async (componentCode) => {
  try {
    const report = await Report.findAll({
      where: { componentCode },
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
async function submitReport(componentCode, content,employeeId=1) {
  try {
    // Tìm Component theo componentCode
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) return { success: false, message: 'Component not found' };

    // Tạo báo cáo mới
    const newReport = await Report.create({
      content,
      employeeId,
      componentCode: component.componentCode,
    });
  

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

module.exports = {submitReport, scanBarcodeFromImage,getReportsByComponentId,deleteReport, deleteReportbyComponentId };
