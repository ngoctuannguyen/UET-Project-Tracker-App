const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  adminLogin,
  checkEmailExists,
  getCurrentUser,
  getUserByUid,
  setUserDetails,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// --- Các route không yêu cầu xác thực ---
router.post("/register", registerUser); // API đăng ký người dùng thường
router.post("/login", loginUser); // API đăng nhập người dùng thường
router.post("/admin/login", adminLogin); // API đăng nhập cho quản lý
router.post("/check-email", checkEmailExists); // API kiểm tra sự tồn tại của email
router.post("/forgot-password", forgotPassword); // API quên mật khẩu

// --- Các route yêu cầu xác thực (sử dụng authMiddleware) ---
// router.get("/getUser", authMiddleware, getCurrentUser); // API lấy thông tin người dùng đang đăng nhập
router.get("/user/:uid", authMiddleware, getUserByUid); // API lấy thông tin người dùng theo UID (thường cho admin)
router.post("/user-details", authMiddleware, setUserDetails);

module.exports = router;
