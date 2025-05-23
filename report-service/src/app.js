const express = require("express");
const path = require("path");
const cors = require("cors");
const reportRoutes = require("./routers/reportRoutes.js");
// Sửa dòng import này
const { rabbitMQService, createEvent } = require("./rabbitmq/rabbitmq.js"); // Destructure để lấy đúng instance và hàm
const {
  deleteReportbyComponentId,
  updateProgress,
  updateStatus,
} = require("./services/reportService");
const {
  deleteProduct,
  deleteComponent,
  addComponent,
  addProduct,
} = require("./services/productAndComponentService");
// mới bổ sung
const projectRoutes = require("./routers/projectRoutes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3004;
const {
  initializeDatabase,
  Product,
  Component,
  Component_Employee,
  Report,
} = require("./models");
console.log({ Product, Component, Component_Employee, Report });

initializeDatabase()
  .then((sequelize) => {
    return sequelize.sync();
  })
  .then(() => {
    console.log("Database synced with models!");
    // Start your server or further initialization here...
  })
  .catch((err) => {
    console.error("Error initializing database:", err);
  });

// Middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/projects", projectRoutes);

// Request logging

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", reportRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to UET-Project-Tracker-App API" });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "An error occurred",
    error: process.env.NODE_ENV === "production" ? {} : err,
  });
});

// Bây giờ rabbitMQService là instance của class RabbitMQService
// và nó có phương thức connect (hoặc startConsuming nếu bạn đã đổi tên theo gợi ý trước)
// Giả sử bạn vẫn dùng tên `connect` trong class RabbitMQService cho consumer
// và hàm `connect` này được thiết kế để nhận callback `onMessage`
const reportServiceBindingKeys = [
  "event.project.created",
  "event.project.deleted",
  "event.project.task.created",
  "event.project.task.removed",
  "event.project.task.updated",
  // Thêm các key khác nếu cần report-service lắng nghe từ project-service
];

// Gọi phương thức connect của instance rabbitMQService
// Lưu ý: Theo các gợi ý trước, bạn có thể đã đổi tên phương thức này thành `startConsuming`
// và nó nhận queueName, bindingKeys, onMessageCallback.
// Nếu bạn vẫn giữ tên `connect` và logic cũ trong RabbitMQService của report-service:
rabbitMQService.connect((routingKey, event) => {
  switch (routingKey) {
    case "event.project.created":
      console.log(`✔️ Project created:`, event);
      const projectCode = event.payload["project_id"];
      const projectName = event.payload["project_name"];
      const progress = event.payload["project_progress"];
      const status = event.payload["project_status"];
      if (projectCode && projectName) {
        addProduct(projectCode, projectName, status)
          .then((result) => {
            if (result) {
              console.log(`✔️ Product added: ${projectCode}`);
            } else {
              console.error(`❌ Failed to add product: ${projectCode}`);
            }
          })
          .catch((error) => {
            console.error(`❌ Error adding product: ${projectCode}`, error);
          });
      } else {
        console.warn(
          "⚠️ Không tìm thấy projectCode hoặc projectName trong event để thêm product."
        );
      }
      break;
    case "event.project.deleted":
      console.log(`❌ Project deleted:`, event);
      const deletedProjectCode = event.payload["project_id"];
      if (deletedProjectCode) {
        deleteProduct(deletedProjectCode)
          .then((result) => {
            if (result) {
              console.log(`✔️ Product deleted: ${deletedProjectCode}`);
            } else {
              console.error(
                `❌ Failed to delete product: ${deletedProjectCode}`
              );
            }
          })
          .catch((error) => {
            console.error(
              `❌ Error deleting product: ${deletedProjectCode}`,
              error
            );
          });
      } else {
        console.warn(
          "⚠️ Không tìm thấy projectCode trong event để xóa product."
        );
      }
      break;
    case "event.project.task.created":
      // TODO: xử lý thêm nếu muốn
      console.log(event.payload["project_task"]);
      const task =
        event.payload["project_task"][event.payload["project_task"].length - 1];
      console.log(`✔️ Task created:`, task);
      const Id = task.task_id || task.data?.task_id || task.componentCode;
      const description = task.work_description || task.data?.work_description;
      const projectId = event.payload["project_id"];
      if (Id && description) {
        addComponent(Id, description, projectId)
          .then((result) => {
            if (result) {
              console.log(`✔️ Component added: ${Id}`);
            } else {
              console.error(`❌ Failed to add component: ${Id}`);
            }
          })
          .catch((error) => {
            console.error(`❌ Error adding component: ${Id}`, error);
          });
      } else {
        console.warn(
          "⚠️ Không tìm thấy Id hoặc description trong event để thêm component."
        );
      }

      break;
    case "event.project.task.removed":
      console.log(`❌ Task removed:`, event);
      const taskId = event.task_id || event.data?.taskId || event.componentCode;
      if (taskId) {
        deleteReportbyComponentId(taskId)
          .then((result) => {
            if (result.success) {
              console.log(`✔️ Report deleted for taskId: ${taskId}`);
            } else {
              console.error(
                `❌ Failed to delete report for taskId: ${taskId}`,
                result.message
              );
            }
          })
          .catch((error) => {
            console.error(
              `❌ Error deleting report for taskId: ${taskId}`,
              error
            );
          });
        deleteComponent(taskId)
          .then((result) => {
            if (result) {
              console.log(`✔️ Component deleted: ${taskId}`);
            } else {
              console.error(`❌ Failed to delete component: ${taskId}`);
            }
          })
          .catch((error) => {
            console.error(`❌ Error deleting component: ${taskId}`, error);
          });
      } else {
        console.warn("⚠️ Không tìm thấy taskId trong event để xóa report.");
      }
    case "event.project.task.updated":
      console.log(`🔄 Task updated:`, event);
      const updatedTaskId =
        event.payload["taskId"] || event.data?.taskId || event.componentCode;
      const updatedStatus =
        event.payload["data"]["project_task"].find(
          (task) => task.task_id === updatedTaskId
        )?.status ||
        event.payload["data"]["project_task"].find(
          (task) => task.componentCode === updatedTaskId
        )?.status;
      console.log(`Updated status: ${updatedStatus}`);
      if (updatedTaskId) {
        updateStatus(updatedTaskId, updatedStatus)
          .then((result) => {
            if (result) {
              console.log(`✔️ Status updated for taskId: ${updatedTaskId}`);
            } else {
              console.error(
                `❌ Failed to update status for taskId: ${updatedTaskId}`
              );
            }
          })
          .catch((error) => {
            console.error(
              `❌ Error updating status for taskId: ${updatedTaskId}`,
              error
            );
          });
        updateProgress(updatedTaskId)
          .then((result) => {
            if (result.success) {
              console.log(`✔️ Progress updated for taskId: ${updatedTaskId}`);
            } else {
              console.error(
                `❌ Failed to update progress for taskId: ${updatedTaskId}`,
                result.message
              );
            }
          })
          .catch((error) => {
            console.error(
              `❌ Error updating progress for taskId: ${updatedTaskId}`,
              error
            );
          });
      } else {
        console.warn(
          "⚠️ Không tìm thấy taskId trong event để cập nhật tiến độ."
        );
      }

      break;
    default:
      console.warn(`Unknown routing key: ${routingKey}`);
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
