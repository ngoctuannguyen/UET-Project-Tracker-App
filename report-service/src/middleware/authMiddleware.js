// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\backend\services\report-service\src\middleware\authMiddleware.js
const admin = require("../config/firebaseAdmin"); // Giả sử bạn có file config firebase admin cho report-service

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No token provided or malformed token." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Gắn thông tin user đã giải mã vào request
    // req.user.uid sẽ là Firebase UID
    // req.user.email sẽ là email
    // Bạn có thể cần lấy employeeId (user_id tùy chỉnh) từ user-service nếu cần ở đây,
    // nhưng cho các API này, chúng ta sẽ nhận employeeId từ client.
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    return res.status(403).json({ message: "Forbidden: Invalid token." });
  }
};

module.exports = authMiddleware;
