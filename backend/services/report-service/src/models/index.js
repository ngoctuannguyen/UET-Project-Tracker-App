const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const config = require("./config.json");

// 1. Tạo CSDL nếu chưa có
async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.username,
      password: config.password,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`
    );
    console.log(`Database '${config.database}' is ready!`);
    await connection.end();
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
}

// 2. Khởi tạo Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: (msg) => {
      if (msg.includes("Error")) console.error(msg);
    },
  }
);

// 3. Import các model

const Product = require("./product")(sequelize, DataTypes);
const Component = require("./component")(sequelize, DataTypes);
const Component_Employee = require("./component-employee")(
  sequelize,
  DataTypes
);
const Report = require("./report")(sequelize, DataTypes);

// 4. Định nghĩa quan hệ

// Project - Product (1 - n)
Product.hasMany(Component, { foreignKey: "productCode" });
Component.belongsTo(Product, { foreignKey: "productCode" });

Component_Employee.hasMany(Component, { foreignKey: "componentCode" });
Component.belongsTo(Component_Employee, { foreignKey: "componentCode" });

// Product - Report (1 - n)
Component.hasMany(Report, { foreignKey: "componentCode" });
Report.belongsTo(Component, { foreignKey: "componentCode" });

// 5. Hàm khởi tạo & đồng bộ
async function initializeDatabase() {
  await createDatabaseIfNotExists();
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully!");
    // Tùy chọn đồng bộ
    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect or sync the database:", error);
    throw error;
  }
}

// 6. Export
module.exports = {
  sequelize,
  initializeDatabase,
  Product,
  Component,
  Component_Employee,
  Report,
};
