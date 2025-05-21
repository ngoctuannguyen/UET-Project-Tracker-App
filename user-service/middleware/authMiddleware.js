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
  // console.log("AuthMiddleware: Headers:", JSON.stringify(authHeader)); // Bỏ comment nếu cần debug sâu header

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
    
    req.user = decodedToken; 
    next(); 
  } catch (error) {
    console.error(
      "AuthMiddleware: Error verifying Firebase ID token:",
      error.message
    );
    console.error("AuthMiddleware: Firebase Error Code:", error.code); 

    let clientMessage = "Invalid token";
    let statusCode = 401; 
    if (error.code === "auth/id-token-expired") {
      clientMessage = "Unauthorized: Token has expired.";
    } else if (error.code === "auth/argument-error") {
      clientMessage = "Unauthorized: Token is malformed or invalid.";
    } else if (error.code === "auth/id-token-revoked") {
      clientMessage = "Unauthorized: Token has been revoked.";
    }

    return res
      .status(statusCode)
      .json({ message: clientMessage, errorCode: error.code });
  }
};

const userMiddleware = async (req, res, next) => {

  const { birthday, email, full_name, gender, role, user_id } = req.body;

  if (!birthday && (!full_name || full_name.trim() === "")) {
    return res.status(400).json({ message: "Không để trống ngày sinh và tên" });
  }

  let birthdayDate = birthday;
  if (typeof birthday === "string" || typeof birthday === "number") {
    birthdayDate = new Date(birthday);
    req.body.birthday = birthdayDate;
  }
  if (!(birthdayDate instanceof Date) || isNaN(birthdayDate.getTime())) {
    return res.status(400).json({ message: "Ngày sinh không hợp lệ." });
  }

  if (!full_name || full_name.trim() === "") {
    return res.status(400).json({ message: "Không để trống tên" });
  }

    // Kiểm tra tên không chứa ký tự đặc biệt
  const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/u;
  if (!nameRegex.test(full_name)) {
    return res.status(400).json({ message: "Tên không được chứa ký tự đặc biệt." });
  }

  console.log("OK");

  next();

};

module.exports = { authMiddleware, userMiddleware };
