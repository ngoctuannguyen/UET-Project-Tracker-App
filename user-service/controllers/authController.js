// Import authService từ config (đảm bảo config/firebase.js export nó)
const { admin, authService, firestoreService } = require("../config/firebase");
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

/// Đăng ký người dùng
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email và password là bắt buộc" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }
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
      email: userRecord.email,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "Email này đã được sử dụng." });
    }
    console.error("Lỗi đăng ký người dùng:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình đăng ký." });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Kiểm tra đầu vào
  if (!email || !password) {
    return res.status(400).json({ error: "Email và password là bắt buộc" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  try {
    // Bước 1: Xác thực với Firebase Authentication
    const firebaseAuthResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId: uid } = firebaseAuthResponse.data;

    // Bước 2: Lấy thông tin người dùng từ Firestore
    const userDocRef = firestoreService.collection("user_service").doc(uid);
    const userDoc = await userDocRef.get();

    let userData = null;
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      console.warn(
        `Không tìm thấy dữ liệu người dùng trong Firestore cho UID: ${uid}.`
      );
      return res.status(404).json({
        error: "Không tìm thấy dữ liệu người dùng. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Lưu token vào httpOnly cookies
    res.cookie("idToken", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Chỉ gửi qua HTTPS trong môi trường production
      sameSite: "Strict", // Ngăn chặn CSRF
      maxAge: 3600000, // 1 giờ
    });

    // Bước 3: Trả về thông tin người dùng và token
    res.status(200).json({
      message: "Đăng nhập thành công",
      idToken,
      refreshToken,
      uid,
      userData,
    });
  } catch (error) {
    // Xử lý lỗi từ Firebase Authentication
    if (error.response && error.response.data && error.response.data.error) {
      const firebaseErrorMessage = error.response.data.error.message;

      // Xử lý các lỗi cụ thể từ Firebase
      switch (firebaseErrorMessage) {
        case "INVALID_LOGIN_CREDENTIALS":
        case "EMAIL_NOT_FOUND":
        case "INVALID_PASSWORD":
          return res
            .status(401)
            .json({ error: "Email hoặc mật khẩu không chính xác." });
        default:
          return res.status(400).json({ error: firebaseErrorMessage });
      }
    }

    // Xử lý các lỗi không mong muốn khác
    console.error("Lỗi đăng nhập người dùng:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình đăng nhập." });
  }
};

// User state check
exports.getUserProfile = async (req, res) => {
  const idToken = req.cookies.idToken;

  if (!idToken) {
    return res.status(401).json({ error: "Người dùng chưa đăng nhập." });
  }

  try {
    // Xác thực token với Firebase
    const decodedToken = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      { idToken }
    );

    const user = decodedToken.data.users[0];
    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
};

exports.updateUserProfile = async (req, res) => {

  try {

    let idToken = req.cookies.idToken || req.headers.authorization; 
    console.log(idToken);
    idToken = idToken?.startsWith("Bearer ") ? idToken.split(" ")[1] : idToken;
    const { full_name, birthday } = req.body;
    if (!idToken) {
      return res.status(401).json({ error: "Người dùng chưa đăng nhập." });
    }
    // Xác thực token với Firebase để lấy uid
    const decodedToken = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      { idToken },
    );
    const user = decodedToken.data.users[0];
    const uid = user.localId || user.userId || user.uid;
    // Cập nhật thông tin trên Firestore (nếu bạn lưu thêm thông tin ở đây)
    const userDocRef = firestoreService.collection("user_service").doc(uid);  
    await userDocRef.set(
      { full_name: full_name, birthday: birthday },
      { merge: true }
    );

    // Lấy lại thông tin mới nhất
    const updatedUser = await admin.auth().getUser(uid);
    res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: {
        uid: updatedUser.user_id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        gender: updatedUser.gender,
        role: updatedUser.role,
        birthday: updatedUser.birthday
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    res.status(400).json({ error: "Cập nhật thông tin thất bại." });
  }
};

//________________________________________________________________________________
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

//________________________________________________________________________________
// Đăng nhập cho Quản lý
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email và password là bắt buộc" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  try {
    const firebaseAuthResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );
    const { idToken, refreshToken, localId: uid } = firebaseAuthResponse.data;

    const userDocRef = firestoreService.collection("user_service").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin người dùng quản lý." });
    }
    const userData = userDoc.data();
    if (userData.role !== "2") {
      // Giả sử role "2" là quản lý
      return res
        .status(403)
        .json({ error: "Truy cập bị từ chối. Bạn không phải là quản lý." });
    }

    res.status(200).json({
      message: "Đăng nhập quản lý thành công",
      idToken,
      refreshToken,
      uid,
      userData,
    });
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      const firebaseErrorMessage = error.response.data.error.message;
      if (
        firebaseErrorMessage === "INVALID_LOGIN_CREDENTIALS" ||
        firebaseErrorMessage === "EMAIL_NOT_FOUND" ||
        firebaseErrorMessage === "INVALID_PASSWORD"
      ) {
        return res
          .status(401)
          .json({ error: "Email hoặc mật khẩu không chính xác." });
      }
      return res.status(400).json({ error: firebaseErrorMessage });
    }
    console.error("Lỗi đăng nhập quản lý:", error);
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi trong quá trình đăng nhập quản lý." });
  }
};

// Kiểm tra sự tồn tại của Email
exports.checkEmailExists = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email là bắt buộc" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Định dạng email không hợp lệ" });
  }

  try {
    await admin.auth().getUserByEmail(email);
    res.status(200).json({ exists: true, message: "Email đã được sử dụng." });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      res.status(200).json({ exists: false, message: "Email có thể sử dụng." });
    } else {
      console.error("Lỗi kiểm tra email:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi kiểm tra email." });
    }
  }
};

// Lấy thông tin người dùng đang đăng nhập (từ token)
// exports.getCurrentUser = async (req, res) => {
//   const uid = req.user.uid; // req.user được gán bởi authMiddleware

//   try {
//     const userDocRef = firestoreService.collection("user_service").doc(uid);
//     const userDoc = await userDocRef.get();

//     if (!userDoc.exists) {
//       // Có thể người dùng tồn tại trong Firebase Auth nhưng chưa có record trong Firestore
//       // Hoặc bạn muốn trả về lỗi nếu không có record Firestore
//       // Thử lấy thông tin từ Firebase Auth nếu không có trong Firestore
//       const firebaseUser = await admin.auth().getUser(uid);
//       return res.status(200).json({
//         user: {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           displayName: firebaseUser.displayName,
//           photoURL: firebaseUser.photoURL,
//           // Bạn có thể thêm các trường khác từ firebaseUser nếu cần
//           // và báo hiệu rằng thông tin chi tiết từ Firestore không có
//           firestoreDataMissing: true,
//         },
//       });
//     }
//     res.status(200).json({ user: userDoc.data() });
//   } catch (error) {
//     console.error("Lỗi lấy thông tin người dùng hiện tại:", error);
//     if (error.code === "auth/user-not-found") {
//       return res.status(404).json({
//         message: "Người dùng không tồn tại trong Firebase Authentication.",
//       });
//     }
//     res
//       .status(500)
//       .json({ error: "Đã xảy ra lỗi khi lấy thông tin người dùng." });
//   }
// };

// Lấy thông tin người dùng bất kỳ bằng UID (ví dụ cho admin)
exports.getUserByUid = async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ error: "UID người dùng là bắt buộc." });
  }
  
  try {
    const userDocRef = firestoreService.collection("user_service").where("user_id", "==", uid);
    const userDoc = await userDocRef.get();

    if (userDoc.empty) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    res.status(200).json({ data: userDoc.docs[0].data() });
  } catch (error) {
    console.error(`Lỗi lấy thông tin người dùng ${uid}:`, error);
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({
        message: "Người dùng không tồn tại trong Firebase Authentication.",
      });
    }
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi lấy thông tin người dùng." });
  }
};

exports.getUserByUserID = async (req, res) => {
  try {

    if (!req.params.user_id) {
      return res.status(400).json({ message: "Thiếu user_id trong request." });
    }
    const userDocRef = firestoreService
      .collection("user_service")
      .where("user_id", "==", req.params.user_id);
    
    const userDocSnapshot = await userDocRef.get();

    if (userDocSnapshot.empty) {
      return res.status(404).json({
        message: `Không tìm thấy người dùng với user_id = ${req.params.user_id}`,
      });
    }

    const userData = userDocSnapshot.docs[0].data();

    return res.status(200).json({ data: userData });

  } catch (error) {
    console.error(`Lỗi lấy thông tin người dùng ${req.params.user_id}:`, error);

    return res.status(500).json({
      error: "Đã xảy ra lỗi khi lấy thông tin người dùng.",
      details: error.message || error.toString(),
    });
  }
};
