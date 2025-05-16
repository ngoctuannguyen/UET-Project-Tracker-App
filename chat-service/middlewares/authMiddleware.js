// filepath: d:\FEManagentToUpdateChat\UET-Project-Tracker-App\chat-service\middlewares\authMiddleware.js
const { admin } = require("../services/firebase"); // Import admin từ firebase service

// const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   let idToken;

//   // Log cơ bản để debug
//   // console.log(
//   //   `[${new Date().toISOString()}] ChatService AuthMiddleware: Incoming request to ${
//   //     req.originalUrl
//   //   }`
//   // );

//   if (authHeader && authHeader.startsWith("Bearer ")) {
//     idToken = authHeader.substring(7, authHeader.length);
//   } else {
//     // console.warn("ChatService AuthMiddleware: Authorization header missing or malformed.");
//     return res.status(401).json({
//       message: "Unauthorized: Authorization header is missing or malformed.",
//     });
//   }

//   if (!idToken) {
//     // console.warn(
//     //   "ChatService AuthMiddleware: ID Token is null or undefined after extraction attempt."
//     // );
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: Token could not be extracted." });
//   }

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     req.user = decodedToken; // Gắn thông tin user đã giải mã vào request
//     // console.log(
//     //   `ChatService AuthMiddleware: Token verified for UID: ${decodedToken.uid}`
//     // );
//     next();
//   } catch (error) {
//     // console.error("ChatService AuthMiddleware: Error verifying token:", error.message);
//     if (error.code === "auth/id-token-expired") {
//       return res
//         .status(401)
//         .json({
//           message: "Unauthorized: Token expired.",
//           code: "TOKEN_EXPIRED",
//         });
//     }
//     return res.status(401).json({ message: "Unauthorized: Invalid token." });
//   }
// };

// module.exports = authMiddleware;

// filepath: d:\FEManagentToUpdateChat\UET-Project-Tracker-App\chat-service\middlewares\authMiddleware.js
// ... (admin import) ...
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[authMiddleware] No token provided or malformed header");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      // Gán thông tin user vào request
      uid: decodedToken.uid,
      email: decodedToken.email,
      // Thêm các thông tin khác từ decodedToken nếu cần
    };
    console.log(`[authMiddleware] Token verified for UID: ${decodedToken.uid}`);
    next();
  } catch (error) {
    console.error("[authMiddleware] Error verifying token:", error.message);
    return res
      .status(403)
      .json({ message: "Unauthorized: Invalid token", error: error.code });
  }
};
module.exports = authMiddleware;
