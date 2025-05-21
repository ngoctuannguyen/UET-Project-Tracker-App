const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const fs = require("fs"); // <<< THÊM fs
const path = require("path"); // <<< THÊM path
const config = require("./config.json"); // Đảm bảo file này tồn tại và đúng cấu hình

const basename = path.basename(__filename);
const db = {}; // Khởi tạo db object

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
    throw error; // Ném lỗi để dừng quá trình nếu không tạo được DB
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
      // Chỉ log lỗi hoặc log SQL nếu cần debug
      if (process.env.NODE_ENV === "development" || msg.includes("Error")) {
        console.log(msg); // Log tất cả trong development hoặc chỉ lỗi
      }
    },
    // Thêm các tùy chọn khác nếu cần, ví dụ pool
  }
);

// 3. Import các model động và lưu vào db object
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && // Không phải file ẩn
      file !== basename && // Không phải chính file index.js này
      file.slice(-3) === ".js" && // Là file .js
      file.indexOf(".test.js") === -1 && // Bỏ qua các file test (nếu có)
      file !== "config.json" // Bỏ qua file config.json
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// 4. Gọi hàm associate của các model (NẾU CÓ)
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Truyền toàn bộ object db (chứa các model khác) vào hàm associate
  }
});

// 5. Hàm khởi tạo & đồng bộ
async function initializeDatabase() {
  await createDatabaseIfNotExists();
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully!");
    // Tùy chọn đồng bộ:
    // { force: true } sẽ xóa bảng và tạo lại (mất dữ liệu) - dùng cẩn thận khi dev
    // { alter: true } sẽ cố gắng cập nhật bảng để khớp model (an toàn hơn)
    await sequelize.sync({ force: true });
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect or sync the database:", error);
    throw error; // Ném lỗi để dừng quá trình nếu không kết nối/đồng bộ được
  }
}

// 6. Export
// Export sequelize instance và các model đã được import và associate
db.sequelize = sequelize;
db.Sequelize = Sequelize; // Export Sequelize class nếu cần
db.initializeDatabase = initializeDatabase;

module.exports = db; // Export toàn bộ db object
