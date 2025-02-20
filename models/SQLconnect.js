// SQLconnect.js
const mysql2 = require("mysql2/promise"); // Thay đổi ở đây

// Tạo một pool kết nối
const pool = mysql2.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "12345678910",
  database: "regis",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});
// Export pool kết nối
module.exports = pool;
