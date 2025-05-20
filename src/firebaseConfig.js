// filepath: d:\FEManagentToUpdateChatandReportService\UET-Project-Tracker-App\src\firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // Bỏ comment nếu bạn cần dùng Firebase Auth client SDK

// TODO: Thay thế bằng cấu hình Firebase của dự án bạn từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBXvt3ICqKMulzklVfPBw_SFIVdSlb8hTw",
  authDomain: "groovy-student-419204.firebaseapp.com",
  projectId: "groovy-student-419204",
  storageBucket: "groovy-student-419204.firebasestorage.app",
  messagingSenderId: "990650286607",
  appId: "1:990650286607:web:340a768117c868394c997a",
  measurementId: "G-PEP7S5BFJL",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const authClient = getAuth(app); // Bỏ comment và đổi tên nếu bạn dùng Firebase Auth client

export { db /*, authClient */ };
