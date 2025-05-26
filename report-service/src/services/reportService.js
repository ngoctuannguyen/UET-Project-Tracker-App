const barcodeService = require("./scanBarcode");
const { rabbitMQService, createEvent } = require("../rabbitmq/rabbitmq.js"); // Sử dụng instance đã export
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
// async function submitReport(componentCode, content, employeeIdInput) {
//   // Đổi tên tham số để rõ ràng hơn
//   try {
//     // Tìm Component theo componentCode
//     const component = await Component.findOne({ where: { componentCode } });
//     if (!component) {
//       return { success: false, message: "Component not found" };
//     }

//     // Sử dụng employeeIdInput nếu nó là một số hợp lệ, ngược lại dùng 1
//     // Hoặc đơn giản là luôn dùng 1 cho mục đích test hiện tại
//     const finalEmployeeId = 1; // <<< THAY ĐỔI: Luôn sử dụng 1 cho employeeId

//     // Tạo báo cáo mới
//     const newReport = await Report.create({
//       content,
//       employeeId: finalEmployeeId, // Sử dụng giá trị đã quyết định
//       componentCode: component.componentCode,
//       reportAt: new Date(),
//     });

//     if (component.is_completed !== 1 && component.is_completed !== true) {
//       component.is_completed = 1;
//       await component.save();
//       console.log(`Component ${componentCode} status updated to completed.`);
//     }

//     return {
//       success: true,
//       report: newReport,
//     };
//   } catch (error) {
//     console.error("Error submitting report and updating component:", error);
//     // Trả về thông điệp lỗi cụ thể từ DB nếu có
//     const dbErrorMessage = error.original?.sqlMessage || error.message;
//     return {
//       success: false,
//       message: "Error submitting report: " + dbErrorMessage,
//     };
//   }
// }

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

const updateProgress = async (productCode) => {
  try {
    if (!productCode) {
      console.error("updateProgress: productCode is required.");
      return {
        success: false,
        message: "productCode is required for progress update.",
        progress: 0, // Trả về progress 0 nếu không có productCode
      };
    }

    const allComponents = await Component.findAll({ where: { productCode } });
    const totalComponents = allComponents.length;

    if (totalComponents === 0) {
      // Nếu không có component nào, coi như progress là 0 hoặc 100 tùy theo logic bạn muốn
      // Ở đây, chúng ta coi là 0 nếu không có component.
      // Cập nhật Product progress thành 0
      const productToUpdate = await Product.findByPk(productCode);
      if (productToUpdate) {
        await productToUpdate.update({ progress: 0 });
        console.log(
          `Progress for product ${productCode} updated to 0% (no components).`
        );
      }
      return { success: true, progress: 0 };
    }

    // Đếm số component có is_completed là "done"
    const completedCount = allComponents.filter(
      (c) => c.is_completed === "done"
    ).length;

    // Tính toán progress, làm tròn đến 2 chữ số thập phân
    const calculatedProgress = parseFloat(
      ((completedCount / totalComponents) * 100).toFixed(2)
    );

    const product = await Product.findByPk(productCode); // Sử dụng findByPk vì productCode là primary key
    if (!product) {
      console.error(`updateProgress: Product ${productCode} not found.`);
      return {
        success: false,
        message: `Product ${productCode} not found for progress update.`,
        progress: 0, // Trả về progress 0 nếu không tìm thấy product
      };
    }

    // Cập nhật progress của Product trong DB
    await product.update({ progress: calculatedProgress });

    console.log(
      `Progress for product ${productCode} updated to ${calculatedProgress}% (${completedCount}/${totalComponents} components done).`
    );
    return { success: true, progress: calculatedProgress };
  } catch (error) {
    console.error("Error updating progress:", error.message);
    return {
      success: false,
      message: "Error updating progress: " + error.message,
      progress: 0, // Trả về progress 0 nếu có lỗi
    };
  }
};

// Hàm mới để lấy chi tiết component và product dựa trên barcode
const getComponentDetailsByBarcode = async (componentCode) => {
  try {
    const component = await Component.findOne({
      where: { componentCode: componentCode },
      include: [
        {
          model: Product,
          as: "Product", // <<< Sử dụng alias "Product" (viết hoa chữ P)
          attributes: ["productCode", "name"], // Giả sử tên trường trong Product model là "name"
        },
      ],
    });

    if (!component) {
      return { success: false, message: "Component not found." };
    }

    const details = {
      componentId: component.componentId,
      componentCode: component.componentCode,
      componentName: component.name, // Giả sử tên trường trong Component model là "name"
      productCode: component.Product?.productCode || "N/A",
      productName: component.Product?.name || "N/A", // Truy cập qua component.Product.name
      is_complete: component.is_completed,
    };

    return { success: true, details: details };
  } catch (error) {
    console.error("Error fetching component details by barcode:", error);
    return {
      success: false,
      message: "Server error fetching component details.",
    };
  }
};

// const submitReport = async (reportData) => {
//   try {
//     const { reportText, imagePath, componentCode, employeeId } = reportData;

//     if (!reportText) {
//       // <<< THÊM: Kiểm tra reportText
//       return { success: false, message: "Report text is required." };
//     }
//     if (!componentCode) {
//       return { success: false, message: "Component code is required." };
//     }
//     if (!employeeId) {
//       return { success: false, message: "Employee ID is required." };
//     }

//     // Không cần tìm component nữa nếu FK trong Report là componentCode
//     // và bạn không cần lấy componentId (INTEGER)
//     // const component = await Component.findOne({
//     //   where: { componentCode: componentCode },
//     // });
//     // if (!component) {
//     //   return { success: false, message: "Component not found." };
//     // }

//     const newReport = await Report.create({
//       reportText: reportText, // <<< SỬA: Đảm bảo tên trường khớp với model
//       imagePath: imagePath,
//       componentCode: componentCode, // <<< SỬA: Sử dụng trực tiếp componentCode
//       employeeId: employeeId,
//       reportAt: new Date(), // <<< SỬA: Đảm bảo tên trường khớp với model
//     });
//     // <<< THÊM LOGIC CẬP NHẬT COMPONENT SAU KHI TẠO REPORT THÀNH CÔNG >>>
//     if (newReport) {
//       const component = await Component.findOne({
//         where: { componentCode: componentCode },
//       });
//       if (component) {
//         // Chỉ cập nhật nếu component chưa được đánh dấu là hoàn thành
//         // Model Component định nghĩa is_completed là BOOLEAN
//         if (component.is_completed !== true) {
//           component.is_completed = true; // Cập nhật thành true
//           await component.save();
//           console.log(
//             `Component ${componentCode} status updated to completed.`
//           );
//         }
//       } else {
//         // Ghi log cảnh báo nếu không tìm thấy component, nhưng vẫn coi việc gửi report là thành công
//         console.warn(
//           `Component ${componentCode} not found for status update after report submission.`
//         );
//       }
//     }
//     return { success: true, report: newReport };
//   } catch (error) {
//     console.error("Error submitting report in service:", error);
//     // Trả về thông điệp lỗi cụ thể hơn từ Sequelize nếu có
//     const errorMessage =
//       error.errors && error.errors.length > 0
//         ? error.errors.map((e) => e.message).join(", ")
//         : error.message;
//     return {
//       success: false,
//       message: "Error submitting report in service: " + errorMessage,
//     };
//   }
// };

// async function submitReportAndUpdateProjectService(reportData) {
//   // reportData: { componentCode, reportText, employeeId, newComponentStatus }
//   // newComponentStatus là trạng thái mới cho component, ví dụ 'in progress' hoặc 'done'
//   try {
//     // 1. Lưu report
//     const newReport = await Report.create({
//       componentCode: reportData.componentCode,
//       reportText: reportData.reportText,
//       employeeId: reportData.employeeId, // Đảm bảo employeeId được truyền vào
//       reportAt: new Date(), // Hoặc reportData.reportAt nếu có
//     });

//     // 2. Cập nhật component status (is_completed)
//     let updatedComponent;
//     if (reportData.newComponentStatus) {
//       const [count, components] = await Component.update(
//         { is_completed: reportData.newComponentStatus },
//         { where: { componentCode: reportData.componentCode }, returning: true }
//       );
//       if (count > 0 && components && components.length > 0) {
//         updatedComponent = components[0];
//       }
//     }
//     // Nếu không có newComponentStatus hoặc update không thành công, lấy component hiện tại
//     if (!updatedComponent) {
//         updatedComponent = await Component.findByPk(reportData.componentCode);
//     }

//     if (!updatedComponent) {
//       console.error(`[Report Service] Component ${reportData.componentCode} not found after submitting report.`);
//       return { success: false, message: `Component ${reportData.componentCode} not found.` };
//     }

//     // 3. Publish sự kiện để project-service cập nhật
//     const eventPayload = {
//       productCode: updatedComponent.productCode, // Chính là project_id trong project-service
//       componentCode: updatedComponent.componentCode, // Chính là task_id trong project-service
//       reportText: newReport.reportText,
//       reportAt: newReport.reportAt.toISOString(),
//       is_completed: updatedComponent.is_completed, // Trạng thái mới nhất của component
//       // employeeId: newReport.employeeId, // Tùy chọn: nếu project-service cần biết ai báo cáo
//     };

//     // Sử dụng một routing key cụ thể cho việc này
//     await rabbitMQService.publishEvent(
//       'event.report.task.updated', // Routing key mới
//       createEvent('TASK_UPDATED_FROM_REPORT', eventPayload)
//     );

//     return { success: true, report: newReport, component: updatedComponent };
//   } catch (error) {
//     console.error('[Report Service] Error in submitReportAndUpdateProjectService:', error);
//     throw error; // Ném lỗi để controller xử lý
//   }
// }
// ...existing code...
const submitReport = async (reportData) => {
  try {
    const { reportText, imagePath, componentCode, employeeId } = reportData;

    if (!reportText) {
      return { success: false, message: "Report text is required." };
    }
    if (!componentCode) {
      return { success: false, message: "Component code is required." };
    }
    if (!employeeId) {
      return { success: false, message: "Employee ID is required." };
    }

    const newReport = await Report.create({
      reportText: reportText,
      // imagePath: imagePath, // Bỏ comment nếu bạn vẫn muốn lưu imagePath vào bảng Report
      componentCode: componentCode,
      employeeId: employeeId,
      reportAt: new Date(),
    });

    if (newReport) {
      const component = await Component.findOne({
        where: { componentCode: componentCode },
      });
      if (component) {
        // Cập nhật trạng thái component từ "in progress" sang "done"
        if (component.is_completed === "in progress") {
          component.is_completed = "done";
          await component.save();
          console.log(
            `Component ${componentCode} status updated from "in progress" to "done".`
          );
        }
      } else {
        console.warn(
          `Component ${componentCode} not found for status update after report submission.`
        );
      }
    }
    return { success: true, report: newReport };
  } catch (error) {
    console.error("Error submitting report in service:", error);
    const errorMessage =
      error.errors && error.errors.length > 0
        ? error.errors.map((e) => e.message).join(", ")
        : error.message;
    return {
      success: false,
      message: "Error submitting report in service: " + errorMessage,
    };
  }
};

// async function submitReportAndUpdateProjectService(reportData) {
//   // reportData: { componentCode, reportText, employeeId, newComponentStatus (tùy chọn) }
//   try {
//     // 1. Lưu report
//     const newReport = await Report.create({
//       componentCode: reportData.componentCode,
//       reportText: reportData.reportText,
//       employeeId: reportData.employeeId,
//       reportAt: new Date(),
//     });

//     // 2. Cập nhật component status
//     const componentToUpdate = await Component.findOne({
//       where: { componentCode: reportData.componentCode },
//     });

//     if (!componentToUpdate) {
//       console.error(
//         `[Report Service] Component ${reportData.componentCode} not found after submitting report.`
//       );
//       // Quyết định xem đây có phải là lỗi nghiêm trọng không.
//       // Nếu component là bắt buộc, bạn có thể throw error hoặc trả về success: false
//       // Hiện tại, nếu không tìm thấy component, sự kiện vẫn có thể được publish với thông tin component cũ (nếu có) hoặc không có.
//       // Để nhất quán, nếu việc cập nhật component là quan trọng, nên báo lỗi.
//       return {
//         success: false,
//         message: `Component ${reportData.componentCode} not found for status update.`,
//       };
//     }

//     // Logic cập nhật trạng thái: "in progress" -> "done" sau khi báo cáo
//     // newComponentStatus từ reportData có thể dùng để ghi đè trạng thái một cách tường minh nếu cần.
//     let finalStatus = componentToUpdate.is_completed;

//     if (
//       reportData.newComponentStatus &&
//       ["not started", "in progress", "done"].includes(
//         reportData.newComponentStatus
//       )
//     ) {
//       // Ưu tiên trạng thái mới nếu được cung cấp tường minh từ client/controller
//       finalStatus = reportData.newComponentStatus;
//     } else if (componentToUpdate.is_completed === "in progress") {
//       // Nếu không có trạng thái mới tường minh, và trạng thái hiện tại là "in progress", thì chuyển sang "done"
//       finalStatus = "done";
//     }

//     if (componentToUpdate.is_completed !== finalStatus) {
//       componentToUpdate.is_completed = finalStatus;
//       await componentToUpdate.save();
//       console.log(
//         `[Report Service] Component ${reportData.componentCode} status updated to "${finalStatus}".`
//       );
//     }

//     // 3. Publish sự kiện để project-service cập nhật
//     const eventPayload = {
//       productCode: componentToUpdate.productCode,
//       componentCode: componentToUpdate.componentCode,
//       reportText: newReport.reportText,
//       reportAt: newReport.reportAt.toISOString(),
//       is_completed: componentToUpdate.is_completed, // Gửi trạng thái cuối cùng của component
//     };

//     await rabbitMQService.publishEvent(
//       "event.report.task.updated",
//       createEvent("TASK_UPDATED_FROM_REPORT", eventPayload)
//     );

//     return { success: true, report: newReport, component: componentToUpdate };
//   } catch (error) {
//     console.error(
//       "[Report Service] Error in submitReportAndUpdateProjectService:",
//       error
//     );
//     throw error;
//   }
// }

async function submitReportAndUpdateProjectService(reportData) {
  try {
    // 1. Lưu report
    const newReport = await Report.create({
      componentCode: reportData.componentCode,
      reportText: reportData.reportText,
      employeeId: reportData.employeeId,
      reportAt: new Date(),
    });

    // 2. Cập nhật component status
    const componentToUpdate = await Component.findOne({
      where: { componentCode: reportData.componentCode },
    });

    if (!componentToUpdate) {
      console.error(
        `[Report Service] Component ${reportData.componentCode} not found after submitting report.`
      );
      return {
        success: false,
        message: `Component ${reportData.componentCode} not found for status update.`,
      };
    }

    let finalStatus = componentToUpdate.is_completed;

    if (
      reportData.newComponentStatus &&
      ["not started", "in progress", "done"].includes(
        reportData.newComponentStatus
      )
    ) {
      finalStatus = reportData.newComponentStatus;
    } else if (componentToUpdate.is_completed === "in progress") {
      finalStatus = "done";
    }

    if (componentToUpdate.is_completed !== finalStatus) {
      componentToUpdate.is_completed = finalStatus;
      await componentToUpdate.save();
      console.log(
        `[Report Service] Component ${reportData.componentCode} status updated to "${finalStatus}".`
      );
    }

    // 3. Tính toán và cập nhật progress của Product
    let productProgress = 0;
    if (componentToUpdate.productCode) {
      const progressResult = await updateProgress(
        componentToUpdate.productCode
      );
      if (progressResult.success) {
        productProgress = progressResult.progress;
      } else {
        // Ghi log lỗi nhưng vẫn tiếp tục để publish sự kiện
        console.warn(
          `[Report Service] Failed to update progress for product ${componentToUpdate.productCode}: ${progressResult.message}`
        );
      }
    } else {
      console.warn(
        `[Report Service] Component ${componentToUpdate.componentCode} does not have a productCode. Cannot update product progress.`
      );
    }

    // 4. Publish sự kiện để project-service cập nhật
    const eventPayload = {
      productCode: componentToUpdate.productCode,
      componentCode: componentToUpdate.componentCode, // Vẫn gửi để project-service biết task nào vừa được cập nhật
      is_completed: componentToUpdate.is_completed,
      product_progress: productProgress, // Gửi progress mới của product
    };

    await rabbitMQService.publishEvent(
      "event.report.task.updated", // Có thể giữ nguyên routing key này hoặc tạo key mới nếu muốn phân biệt rõ hơn
      // Ví dụ: "event.report.product.progress.updated"
      // Hiện tại, giữ nguyên để project-service xử lý chung
      createEvent("TASK_AND_PRODUCT_PROGRESS_UPDATED_FROM_REPORT", eventPayload) // Cập nhật event_type nếu cần
    );

    return {
      success: true,
      report: newReport,
      component: componentToUpdate,
      productProgress: productProgress,
    };
  } catch (error) {
    console.error(
      "[Report Service] Error in submitReportAndUpdateProjectService:",
      error
    );
    throw error;
  }
}

module.exports = {
  submitReport,
  scanBarcodeFromImage,
  getReportsByComponentId,
  deleteReport,
  deleteReportbyComponentId,
  updateProgress, // Giữ lại nếu cần ở nơi khác
  updateStatus,
  getComponentDetailsByBarcode,
  submitReportAndUpdateProjectService, // Hàm mới
};
