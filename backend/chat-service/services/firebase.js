const admin = require("firebase-admin");
// Đảm bảo đường dẫn đến file service account là chính xác
const serviceAccount = require("../service_account/firebase-service-account.json");

// Khởi tạo Firebase Admin SDK chỉ một lần
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK Initialized successfully in chat-service.");
} else {
  console.log("Firebase Admin SDK already initialized in chat-service.");
}

const db = admin.firestore();

// Đổi tên biến để tránh trùng lặp và export đúng tên mà model đang sử dụng
const chat_service_ref = db.collection("chat_service"); // Giả sử collection của bạn tên là "chat_service"

module.exports = { db, chat_service: chat_service_ref, admin }; // Export 'chat_service' và 'admin'
// ...existing code...
