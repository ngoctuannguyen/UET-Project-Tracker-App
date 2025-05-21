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
    // Bước 1: Xác thực với Firebase Authentication
    const firebaseAuthResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId: uid } = firebaseAuthResponse.data; // localId chính là authUid (Firebase UID)

    // Bước 2: Lấy thông tin người dùng từ Firestore sử dụng uid làm Document ID
    const userDocRef = firestoreService.collection("user_service").doc(uid);
    const userDoc = await userDocRef.get();

    let userData = null;
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      // Trường hợp này có thể xảy ra nếu người dùng tồn tại trong Firebase Auth
      // nhưng chưa có bản ghi tương ứng trong collection 'user_service'.
      // Bạn có thể quyết định cách xử lý:
      // 1. Trả về lỗi.
      // 2. Trả về thông tin từ Auth và một cờ báo hiệu thiếu dữ liệu Firestore.
      // 3. Tự động tạo bản ghi Firestore (cần thêm thông tin).
      console.warn(
        `User data not found in Firestore for UID (docId): ${uid} after login. User exists in Firebase Auth.`
      );
      // Ví dụ: trả về thông tin cơ bản từ Auth nếu không có trong Firestore
      // userData = { email: email, uid: uid, firestoreDataMissing: true };
    }

    res.status(200).json({
      message: "Đăng nhập thành công",
      idToken,
      refreshToken,
      uid, // uid (authUid) giờ là docId
      userData, // Trả về dữ liệu người dùng từ Firestore (có thể null nếu không tìm thấy)
    });
  } catch (error) {
    // Xử lý lỗi từ Firebase Authentication
    if (error.response && error.response.data && error.response.data.error) {
      const firebaseErrorMessage = error.response.data.error.message;
      if (
        firebaseErrorMessage === "INVALID_LOGIN_CREDENTIALS" ||
        firebaseErrorMessage === "EMAIL_NOT_FOUND" ||
        firebaseErrorMessage === "INVALID_PASSWORD" // Các mã lỗi cũ hơn, INVALID_LOGIN_CREDENTIALS là mã mới hơn
      ) {
        return res
          .status(401)
          .json({ error: "Email hoặc mật khẩu không chính xác." });
      }
      // Các lỗi khác từ Firebase Auth
      return res.status(400).json({ error: firebaseErrorMessage });
    }
    // Các lỗi không mong muốn khác
    console.error("Lỗi đăng nhập người dùng:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình đăng nhập." });
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

// Lấy thông tin người dùng bất kỳ bằng UID (ví dụ cho admin)
// exports.getUserByUid = async (req, res) => {
//   const { uid } = req.params;

//   if (!uid) {
//     return res.status(400).json({ error: "UID người dùng là bắt buộc." });
//   }
//   // Tùy chọn: Kiểm tra quyền admin ở đây nếu cần
//   // const requesterUid = req.user.uid; // Người dùng đang thực hiện request
//   // const requesterDoc = await firestoreService.collection("user_service").doc(requesterUid).get();
//   // if (!requesterDoc.exists || requesterDoc.data().role !== "2") {
//   //   return res.status(403).json({ error: "Không có quyền truy cập thông tin người dùng này." });
//   // }

//   try {
//     const userDocRef = firestoreService.collection("user_service").doc(uid);
//     const userDoc = await userDocRef.get();

//     if (!userDoc.exists) {
//       // Thử lấy thông tin từ Firebase Auth nếu không có trong Firestore
//       const firebaseUser = await admin.auth().getUser(uid);
//       return res.status(200).json({
//         user: {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           displayName: firebaseUser.displayName,
//           photoURL: firebaseUser.photoURL,
//           firestoreDataMissing: true,
//         },
//       });
//     }
//     res.status(200).json({ user: userDoc.data() });
//   } catch (error) {
//     console.error(`Lỗi lấy thông tin người dùng ${uid}:`, error);
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
// ...existing code...
exports.getUserByUid = async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ error: "UID người dùng là bắt buộc." });
  }

  try {
    const userDocRef = firestoreService.collection("user_service").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // Thử lấy thông tin từ Firebase Auth nếu không có trong Firestore
      try {
        const firebaseUser = await admin.auth().getUser(uid);
        return res.status(200).json({
          user: {
            uid: firebaseUser.uid, // Auth UID
            docId: firebaseUser.uid, // Để nhất quán với client
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || firebaseUser.email, // Sử dụng displayName làm fullName fallback
            // photoURL: firebaseUser.photoURL,
            // Các trường này không có trong Firebase Auth, trả về null hoặc bỏ qua
            role: null,
            user_id: null,
            firestoreDataMissing: true, // Cờ báo thiếu dữ liệu từ Firestore
          },
        });
      } catch (authError) {
        // Nếu không tìm thấy cả trong Firestore và Auth
        if (authError.code === "auth/user-not-found") {
          return res.status(404).json({
            message: `Người dùng với UID ${uid} không tồn tại trong hệ thống.`,
          });
        }
        // Lỗi khác khi truy vấn Firebase Auth
        console.error(
          `Lỗi khi lấy thông tin người dùng ${uid} từ Firebase Auth:`,
          authError
        );
        return res
          .status(500)
          .json({ error: "Lỗi máy chủ khi xác thực người dùng." });
      }
    }

    // Nếu tìm thấy trong Firestore
    const userDataFromFirestore = userDoc.data();
    res.status(200).json({
      user: {
        uid: userDoc.id, // UID (Document ID từ Firestore)
        docId: userDoc.id, // Thêm docId để nhất quán với client
        email: userDataFromFirestore.email,
        fullName: userDataFromFirestore.full_name, // Ánh xạ full_name từ Firestore sang fullName
        // Các trường khác từ Firestore nếu client cần
        gender: userDataFromFirestore.gender,
        birthday: userDataFromFirestore.birthday, // Client sẽ cần parse nếu là Timestamp
        role: userDataFromFirestore.role,
        user_id: userDataFromFirestore.user_id, // Mã người dùng tùy chỉnh
        firestoreDataMissing: false,
      },
    });
  } catch (error) {
    // Lỗi chung khi truy vấn Firestore (không phải lỗi không tìm thấy user đã xử lý ở trên)
    console.error(`Lỗi chung khi lấy thông tin người dùng ${uid}:`, error);
    // Tránh trả về chi tiết lỗi nếu không phải là lỗi "user-not-found" đã được xử lý
    if (error.code === "auth/user-not-found") {
      // Double check, dù đã có try-catch bên trong
      return res.status(404).json({
        message: "Người dùng không tồn tại trong Firebase Authentication.",
      });
    }
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi lấy thông tin người dùng." });
  }
};

// --- THÊM CONTROLLER MỚI ---
// Tạo/Cập nhật thông tin chi tiết người dùng trong Firestore
exports.setUserDetails = async (req, res) => {
  // Thông tin này nên được lấy từ authMiddleware nếu API này yêu cầu admin phải đăng nhập
  // const adminUid = req.user.uid; // Giả sử admin đã được xác thực

  // Tuy nhiên, theo mô tả, admin đã đăng ký user và giờ muốn set details
  // nên có thể không cần check quyền admin ở đây nếu luồng đã được bảo vệ ở tầng khác
  // hoặc nếu API này chỉ dành cho admin.

  const {
    uid, // Firebase UID của người dùng cần cập nhật (sẽ là Document ID)
    email, // Email của người dùng (có thể dùng để kiểm tra hoặc không, tùy logic)
    birthday, // Sẽ là chuỗi dạng "YYYY-MM-DD" hoặc tương tự từ client
    full_name,
    gender,
    role,
    user_id, // Mã nhân viên tùy chỉnh (string)
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!uid) {
    return res
      .status(400)
      .json({ error: "UID (Firebase User ID) là bắt buộc." });
  }
  if (!email) {
    // Email có thể không bắt buộc nếu chỉ dựa vào UID, nhưng thường nên có để đối chiếu
    return res.status(400).json({ error: "Email là bắt buộc." });
  }
  if (!full_name) {
    return res
      .status(400)
      .json({ error: "Họ và tên (full_name) là bắt buộc." });
  }
  if (!role) {
    return res.status(400).json({ error: "Vai trò (role) là bắt buộc." });
  }
  if (user_id === undefined || user_id === null) {
    // user_id có thể là chuỗi rỗng, nhưng phải được cung cấp
    return res
      .status(400)
      .json({ error: "Mã người dùng (user_id) là bắt buộc." });
  }

  try {
    // Kiểm tra xem người dùng có tồn tại trong Firebase Authentication không (tùy chọn nhưng nên có)
    try {
      await admin.auth().getUser(uid);
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        return res.status(404).json({
          error: `Người dùng với UID ${uid} không tồn tại trong Firebase Authentication.`,
        });
      }
      // Lỗi khác khi lấy user từ Auth
      console.error(
        "Lỗi khi kiểm tra người dùng trong Firebase Auth:",
        authError
      );
      return res.status(500).json({ error: "Lỗi khi xác thực người dùng." });
    }

    const userDocRef = firestoreService.collection("user_service").doc(uid);

    // --- THAY ĐỔI Ở ĐÂY ---
    let birthdayTimestamp = null;
    if (birthday) {
      // Kiểm tra xem birthday có phải là một chuỗi ngày hợp lệ không trước khi chuyển đổi
      // Ví dụ đơn giản: new Date(birthday) sẽ trả về "Invalid Date" nếu chuỗi không hợp lệ
      const dateObject = new Date(birthday);
      if (!isNaN(dateObject.getTime())) {
        // Kiểm tra xem dateObject có hợp lệ không
        birthdayTimestamp = admin.firestore.Timestamp.fromDate(dateObject);
      } else {
        // Xử lý trường hợp birthday không phải là định dạng ngày hợp lệ
        // Bạn có thể trả về lỗi 400 hoặc bỏ qua trường birthday
        console.warn(
          `Định dạng birthday không hợp lệ: ${birthday}. Sẽ lưu là null.`
        );
        // Hoặc: return res.status(400).json({ error: `Định dạng birthday không hợp lệ: ${birthday}` });
      }
    }

    const userData = {
      email,
      birthday: birthdayTimestamp, // <<< SỬ DỤNG GIÁ TRỊ TIMESTAMP
      full_name,
      gender: gender || null,
      role,
      user_id,
      // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Nếu tạo mới
      // updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Luôn cập nhật
    };
    // --- KẾT THÚC THAY ĐỔI ---

    await userDocRef.set(userData, { merge: true });

    res.status(200).json({
      message: `Thông tin chi tiết cho người dùng UID ${uid} đã được lưu thành công.`,
      data: userData, // userData ở đây sẽ có birthday là đối tượng Timestamp
    });
  } catch (error) {
    console.error("Lỗi khi lưu thông tin chi tiết người dùng:", error);
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi lưu thông tin chi tiết người dùng." });
  }
};

// module.exports = {
//   registerUser,
//   loginUser,
//   forgotPassword,
//   adminLogin,
//   checkEmailExists,
//   // getCurrentUser, // Bạn đã comment dòng này
//   getUserByUid,
//   setUserDetails, // <<< THÊM: Export controller mới
// };
