const admin = require("firebase-admin");

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