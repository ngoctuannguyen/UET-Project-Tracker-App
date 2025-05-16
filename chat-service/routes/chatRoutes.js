const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat_controller");
const validateMessage = require("../middlewares/validateMessage");
const validateGroup = require("../middlewares/validateGroup");
const authMiddleware = require("../middlewares/authMiddleware"); // <<< THÊM DÒNG NÀY

// Group routes
// Tất cả các API liên quan đến group và message đều cần xác thực người dùng
router.post(
  "/groups",
  authMiddleware,
  validateGroup,
  chatController.createGroup
);
router.put(
  "/groups/:groupId/members",
  authMiddleware,
  chatController.addGroupMember
); // validateGroup có thể không cần ở đây hoặc cần middleware riêng
router.get("/groups/:groupId", authMiddleware, chatController.getGroupById);
// Đảm bảo :userId trong route này được so sánh với req.user.uid trong controller để bảo mật
router.get(
  "/users/:userId/groups",
  authMiddleware,
  chatController.getUserGroups
);
router.put(
  "/groups/:groupId/admins",
  authMiddleware,
  chatController.addGroupAdmin
);
router.delete(
  "/groups/:groupId/admins",
  authMiddleware,
  chatController.removeGroupAdmin
);
router.delete("/groups/:groupId", authMiddleware, chatController.removeGroup);
router.delete(
  "/groups/:groupId/members",
  authMiddleware,
  chatController.removeGroupMember
);
router.get("/groups", authMiddleware, chatController.getAllGroups); // Cân nhắc nếu route này thực sự cần thiết và ai có quyền truy cập
router.get(
  "/groups/:groupId/members",
  authMiddleware,
  chatController.getGroupMembers
);

// Message routes (Thêm nếu chưa có)
// Route để gửi tin nhắn vào một group
router.post(
  "/groups/:groupId/messages",
  authMiddleware,
  validateMessage,
  chatController.sendMessage
);
// Route để lấy tất cả tin nhắn của một group
router.get(
  "/groups/:groupId/messages",
  authMiddleware,
  chatController.getGroupMessages
);
// Các route khác cho message (update, delete) nếu có cũng cần authMiddleware
// router.put("/groups/:groupId/messages/:messageId", authMiddleware, validateMessage, chatController.updateMessage);
// router.delete("/groups/:groupId/messages/:messageId", authMiddleware, chatController.deleteMessage);

module.exports = router;
