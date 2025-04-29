// Import authService từ config (đảm bảo config/firebase.js export nó)
const { admin, authService } = require("../config/firebase");
const axios = require("axios");
const nodemailer = require("nodemailer"); // Import nodemailer
const dotenv = require("dotenv"); // Import dotenv để đọc biến môi trường

dotenv.config();

// !!! THÊM DÒNG NÀY ĐỂ KIỂM TRA - NHỚ XÓA SAU KHI DEBUG !!!
console.log("EMAIL_PASS loaded:", process.env.EMAIL_PASS);
// !!! ------------------------------------------------- !!!

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10), // Chuyển port sang số
  secure: process.env.EMAIL_SECURE === "true", // Chuyển secure sang boolean
  auth: {
    user: process.env.EMAIL_USER, // Email gửi
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng
  },
});

// Kiểm tra transporter khi khởi động (tùy chọn nhưng hữu ích)
transporter.verify(function (error, success) {
  if (error) {
    console.error("Lỗi cấu hình Nodemailer:", error);
  } else {
    console.log("Nodemailer đã sẵn sàng để gửi email.");
  }
});

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

//forgot pass:

// --- Cập nhật forgotPassword ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email là bắt buộc" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  // Kiểm tra authService và generatePasswordResetLink
  if (
    !authService ||
    typeof authService.generatePasswordResetLink !== "function"
  ) {
    console.error(
      "Auth Service hoặc generatePasswordResetLink không khả dụng!"
    );
    return res.status(500).json({ error: "Lỗi cấu hình dịch vụ xác thực." });
  }

  try {
    console.log(`Attempting to generate password reset link for ${email}...`);

    // Cấu hình cho link reset (quan trọng: URL frontend)
    const actionCodeSettings = {
      url: process.env.FRONTEND_RESET_PASSWORD_URL, // URL trang xử lý reset trên frontend
      handleCodeInApp: false, // Thường là false cho web
    };

    // Tạo link reset
    const link = await authService.generatePasswordResetLink(
      email,
      actionCodeSettings
    );
    console.log("Password reset link generated successfully.");

    // Chuẩn bị nội dung email
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Tên hiển thị và email gửi
      to: email, // Email người nhận
      subject: "Yêu cầu đặt lại mật khẩu", // Tiêu đề email
      text: `Xin chào,\n\nBạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\nVui lòng nhấp vào liên kết sau để đặt lại mật khẩu:\n\n${link}\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ Your App Name`, // Nội dung dạng text
      html: `<p>Xin chào,</p>
             <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
             <p>Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu:</p>
             <p><a href="${link}">Đặt lại mật khẩu</a></p>
             <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
             <p>Trân trọng,<br/>Đội ngũ Your App Name</p>`, // Nội dung dạng HTML
    };

    // Gửi email
    console.log(`Sending password reset email to ${email}...`);
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully via Nodemailer.");

    // Trả về phản hồi thành công chung
    res.status(200).json({
      message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.",
    });
  } catch (error) {
    console.error("Lỗi trong quá trình forgotPassword:", error);

    if (error.code === "auth/user-not-found") {
      // Vẫn trả về thành công để bảo mật
      console.log(
        `User not found for email ${email}, but returning success message.`
      );
      return res.status(200).json({
        message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.",
      });
    }

    // Các lỗi khác (lỗi tạo link, lỗi gửi mail...)
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu đặt lại mật khẩu." });
  }
};
