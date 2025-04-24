const express = require("express"); // Thay import bằng require
const {
  registerUser,
  loginUser,
  forgotPassword,
} = require("../controllers/authController"); // Thay import bằng require
const authMiddleware = require("../middleware/authMiddleware"); // Thay import bằng require

const router = express.Router();

// router.post("/register", registerUser);
router.post("/login", loginUser);
// router.get("/user", authMiddleware, getUser); // Giữ nguyên dòng này nếu bạn có hàm getUser
router.post("/forgot-password", forgotPassword); // Thêm route mới

module.exports = router; // Thay export default bằng module.exports
