// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\backend\services\report-service\src\controllers\projectController.js
const { Product, Component, sequelize } = require("../models"); // Đảm bảo models được export đúng từ index.js
const { Op } = require("sequelize");

// Lấy danh sách dự án (products) mà một employee tham gia
exports.getProjectsByEmployee = async (req, res) => {
  const { employeeId } = req.params; // employeeId này là user_id tùy chỉnh (VNU1, VNU2,...)

  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID là bắt buộc." });
  }

  try {
    // Tìm tất cả các component mà employee này được gán
    const components = await Component.findAll({
      where: { employeeId: employeeId },
      attributes: ["productCode"], // Chỉ cần productCode để tránh dư thừa dữ liệu
      raw: true,
    });

    if (!components || components.length === 0) {
      return res.status(200).json([]); // Trả về mảng rỗng nếu không tham gia component nào
    }

    // Lấy danh sách các productCode duy nhất
    const productCodes = [...new Set(components.map((c) => c.productCode))];

    // Tìm tất cả các product (dự án) dựa trên productCodes đã thu thập
    const projects = await Product.findAll({
      where: {
        productCode: {
          [Op.in]: productCodes,
        },
      },
      order: [["name", "ASC"]], // Sắp xếp theo tên dự án
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error("Lỗi khi lấy dự án theo employee ID:", error);
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi máy chủ khi lấy danh sách dự án." });
  }
};

// Lấy danh sách components của một dự án cụ thể mà một employee tham gia
exports.getProjectComponentsByEmployee = async (req, res) => {
  const { productCode, employeeId } = req.params;

  if (!productCode || !employeeId) {
    return res
      .status(400)
      .json({ error: "Product Code và Employee ID là bắt buộc." });
  }

  try {
    const components = await Component.findAll({
      where: {
        productCode: productCode,
        employeeId: employeeId,
      },
      include: [
        {
          // Tùy chọn: Lấy thêm thông tin Product nếu cần
          model: Product,
          as: "Product", // Alias đã định nghĩa trong model Component
          attributes: ["name"], // Chỉ lấy tên sản phẩm
        },
      ],
      order: [["name", "ASC"]], // Sắp xếp theo tên component
    });

    if (!components) {
      return res.status(404).json({
        message: "Không tìm thấy components cho dự án và employee này.",
      });
    }

    res.status(200).json(components);
  } catch (error) {
    console.error("Lỗi khi lấy components của dự án theo employee ID:", error);
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi máy chủ khi lấy danh sách components." });
  }
};
