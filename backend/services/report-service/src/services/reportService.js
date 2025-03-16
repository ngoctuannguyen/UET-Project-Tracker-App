
const barcodeService = require('./scanBarcode');
const { Report, Product, Employee } = require('../models');


const getReportsByProductId = async (productId) => {
  try {
    const reports = await Report.findAll({
      where: { productId },
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
async function submitReport( productCode, content) {
  try {
    // // Tìm Employee theo employeeCode
    // const employee = await Employee.findOne({ where: { employeeCode } });
    // if (!employee) return { success: false, message: 'Employee not found' };

    // Tìm Product theo productCode
    const product = await Product.findOne({ where: { productCode } });
    if (!product) return { success: false, message: 'Product not found' };

    // Tạo báo cáo
    const newReport = await Report.create({
      content,
      employeeId: 1,
      productId: product.id,
    });

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
