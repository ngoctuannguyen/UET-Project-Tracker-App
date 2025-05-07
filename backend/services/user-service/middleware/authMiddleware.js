const { admin } = require("../config/firebase"); // Đảm bảo admin được export đúng từ firebase.js

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let idToken;

  // Log cơ bản để debug
  console.log(
    `[${new Date().toISOString()}] AuthMiddleware: Incoming request to ${
      req.originalUrl
    }`
  );
  // console.log("AuthMiddleware: Headers:", JSON.stringify(req.headers, null, 2)); // Bỏ comment nếu cần debug sâu header

  if (authHeader && authHeader.startsWith("Bearer ")) {
    idToken = authHeader.substring(7, authHeader.length);
    console.log("AuthMiddleware: Extracted ID Token:", idToken); // Bỏ comment nếu cần debug token
  } else {
    console.warn("AuthMiddleware: Authorization header missing or malformed.");
    return res.status(401).json({
      message: "Unauthorized: Authorization header is missing or malformed.",
    });
  }

  if (!idToken) {
    console.warn(
      "AuthMiddleware: ID Token is null or undefined after extraction attempt."
    );
    return res
      .status(401)
      .json({ message: "Unauthorized: Token could not be extracted." });
  }

  try {
    // console.log("AuthMiddleware: Attempting to verify token with Firebase Admin SDK..."); // Bỏ comment nếu cần
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // console.log("AuthMiddleware: Token verified successfully. UID:", decodedToken.uid); // Bỏ comment nếu cần
    req.user = decodedToken; // Gán thông tin người dùng đã giải mã vào request
    next(); // Chuyển sang controller tiếp theo
  } catch (error) {
    console.error(
      "AuthMiddleware: Error verifying Firebase ID token:",
      error.message
    );
    console.error("AuthMiddleware: Firebase Error Code:", error.code); // Mã lỗi cụ thể từ Firebase

    let clientMessage = "Invalid token";
    let statusCode = 401; // Mặc định là Unauthorized

    if (error.code === "auth/id-token-expired") {
      clientMessage = "Unauthorized: Token has expired.";
    } else if (error.code === "auth/argument-error") {
      clientMessage = "Unauthorized: Token is malformed or invalid.";
    } else if (error.code === "auth/id-token-revoked") {
      clientMessage = "Unauthorized: Token has been revoked.";
    }
    // Bạn có thể thêm các case lỗi cụ thể khác từ Firebase nếu cần

    return res
      .status(statusCode)
      .json({ message: clientMessage, errorCode: error.code });
  }
};

module.exports = authMiddleware;
