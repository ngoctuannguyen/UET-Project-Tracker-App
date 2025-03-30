const admin = require("../config/firebase");
const axios = require("axios");

// Đăng ký người dùng
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  // Kiểm tra đầu vào
  if (!email || !password) {
    return res.status(400).json({ error: "Email và password là bắt buộc" });
  }

  // Kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  // Kiểm tra độ dài mật khẩu (Firebase yêu cầu ít nhất 6 ký tự)
  if (password.length < 6) {
    return res.status(400).json({ error: "Mật khẩu phải dài ít nhất 6 ký tự" });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.status(201).json({
      message: "Đăng ký người dùng thành công",
      userId: userRecord.uid,
      email: userRecord.email, // Xác nhận email đã được thiết lập
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Đăng nhập người dùng
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email và password là bắt buộc" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId } = response.data;
    res.status(200).json({
      message: "Đăng nhập thành công",
      idToken,
      refreshToken,
      uid: localId,
    });
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(400).json({ error: errorMessage });
  }
};
