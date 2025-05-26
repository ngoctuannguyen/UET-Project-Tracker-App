const express = require("express");
const path = require("path");
const cors = require("cors");
const reportRoutes = require("./routers/reportRoutes.js");

// rabbitMQService giờ đây là instance của RabbitMQService đã hợp nhất
// createEvent cũng được export từ rabbitmq.js
const { rabbitMQService } = require("./rabbitmq/rabbitmq.js");

// Các service khác không thay đổi
const {
  initializeDatabase,
  // Product, // Không cần import trực tiếp model ở đây nếu service đã xử lý
  // Component,
  // Report
} = require("./models");

const app = express();
const PORT = process.env.PORT || 3004;

initializeDatabase()
  .then((sequelize) => {
    // Không cần sequelize.sync() ở đây nếu bạn dùng migration hoặc sync ở nơi khác
    // Nếu vẫn muốn sync khi khởi động app:
    // return sequelize.sync({ alter: true }); // alter: true cẩn thận khi dùng ở production
    console.log("Database connection established.");
  })
  .then(() => {
    console.log(
      "Database setup complete (models might be synced via migrations or elsewhere)."
    );

    // Khởi động RabbitMQ consumer sau khi DB sẵn sàng (hoặc song song nếu không phụ thuộc)
    rabbitMQService.startConsuming().catch((err) => {
      console.error(
        "[Report Service App] Failed to start RabbitMQ consumer initially:",
        err.message
      );
      // Có thể có logic retry ở đây hoặc để RabbitMQService tự xử lý retry kết nối
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Report Service is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error initializing application:", err);
    process.exit(1); // Thoát nếu không khởi tạo được DB
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", reportRoutes); // reportRoutes sẽ sử dụng rabbitMQService.publishEvent

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to UET-Project-Tracker-App Report Service API",
  });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err.message || err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred",
    // Chỉ trả về stack trace ở môi trường dev
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

module.exports = app;
