
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

const updateStatus = async (componentCode, status) => {

  try {
    // Tìm component theo componentCode
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) return { success: false, message: 'Component not found' };
    // Cập nhật trạng thái
    if (status === 'completed') {
       component.is_completed = 1;
    }
    await component.save();
    return { success: true, message: 'Component status updated successfully' };
  }
  catch (error) {
    console.error('Error updating component status:', error);
    return { success: false, message: error.message };
  }
}

const updateProgress = async (componentCode) => {
  try {
    const component = await Component.findOne({ where: { componentCode } });
    if (!component) throw new Error('Component not found');

    const productCode = component.productCode;

    const allComponents = await Component.findAll({ where: { productCode } });
    const total = allComponents.length;

    if (!total) throw new Error('No components found for product');

    // Đếm số component đã hoàn thành
    const completedCount = allComponents.filter(c => c.is_completed).length;
    console.log(`Total components: ${total}, Completed components: ${completedCount}`);
    // Tính progress chính xác
    const progress = Math.round((completedCount / total) * 100);

    // Cập nhật product
    const product = await Product.findOne({ where: { productCode } });
    if (!product) throw new Error('Product not found');

    await product.update({ progress });

    console.log(`Progress for product ${productCode} updated to ${progress}%`);
    return { success: true, progress };
  } catch (error) {
    console.error('Error updating progress:', error.message);
    return { success: false, message: error.message };
  }
};



module.exports = {submitReport, scanBarcodeFromImage,getReportsByComponentId,deleteReport, deleteReportbyComponentId,updateProgress,updateStatus};
