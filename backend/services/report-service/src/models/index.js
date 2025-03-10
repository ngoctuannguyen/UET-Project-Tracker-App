const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2/promise');
const config = require('./config.json');

// 1. Tạo CSDL nếu chưa có
async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.username,
      password: config.password,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    console.log(`Database '${config.database}' is ready!`);
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
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
      if (msg.includes('Error')) console.error(msg);
    },
  }
);

// 3. Import các model
const Project = require('./project')(sequelize, DataTypes);
const Unit = require('./unit')(sequelize, DataTypes);
const Employee = require('./employee')(sequelize, DataTypes);
const Product = require('./product')(sequelize, DataTypes);
const Report = require('./report')(sequelize, DataTypes);

// 4. Định nghĩa quan hệ
// Project - Unit (1 - n)
Project.hasMany(Unit, { foreignKey: 'projectId' });
Unit.belongsTo(Project, { foreignKey: 'projectId' });

// Unit - Employee (1 - n)
Unit.hasMany(Employee, { foreignKey: 'unitId' });
Employee.belongsTo(Unit, { foreignKey: 'unitId' });

// Project - Product (1 - n)
Project.hasMany(Product, { foreignKey: 'projectId' });
Product.belongsTo(Project, { foreignKey: 'projectId' });

// Employee - Report (1 - n)
Employee.hasMany(Report, { foreignKey: 'employeeId' });
Report.belongsTo(Employee, { foreignKey: 'employeeId' });

// Product - Report (1 - n)
Product.hasMany(Report, { foreignKey: 'productId', onDelete: 'SET NULL' });
Report.belongsTo(Product, { foreignKey: 'productId', onDelete: 'SET NULL' });

// 5. Hàm khởi tạo & đồng bộ
async function initializeDatabase() {
  await createDatabaseIfNotExists();
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully!');
    // Tùy chọn đồng bộ
    await sequelize.sync({ alter: true }); 
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect or sync the database:', error);
    throw error;
  }
}

// 6. Export
module.exports = {
  sequelize,
  initializeDatabase,
  Project,
  Unit,
  Employee,
  Product,
  Report
};
