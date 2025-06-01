const express = require('express');
const path = require('path');
const cors = require('cors');
const reportRoutes = require('./routers/reportRoutes.js')
const RabbitMQConsumer = require('./rabbitmq/rabbitmq.js');
const {deleteReportbyComponentId,updateProgress,updateStatus} = require('./services/reportService');
const { deleteProduct, deleteComponent, addComponent,addProduct } = require('./services/productAndComponentService');
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

try {
    RabbitMQConsumer.connect();
    RabbitMQConsumer.handleEvent();
} catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
