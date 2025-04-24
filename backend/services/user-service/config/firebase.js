const admin = require("firebase-admin"); // <-- Sửa dòng này: require đúng package
const dotenv = require("dotenv");
dotenv.config();

const serviceAccount = require("../service_account/firebase-service-account.json");

// Khởi tạo app mặc định nếu chưa có
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK Initialized successfully.");
} else {
  console.log("Firebase Admin SDK already initialized.");
}

// Lấy auth service từ app mặc định
const authService = admin.auth();

// --- DEBUG (Có thể giữ lại hoặc xóa nếu muốn) ---
console.log(
  "Kiểm tra authService ngay sau khi lấy:",
  typeof authService.generatePasswordResetLink, // Kiểm tra hàm đúng của Admin SDK
  Object.keys(authService).length > 5 // Kiểm tra xem có nhiều key hơn không
);
// ---------------

// Export cả admin và authService
module.exports = { admin, authService };
