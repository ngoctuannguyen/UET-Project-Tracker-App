// filepath: d:\UET-Project-Tracker-App\backend\chat-service\routes\chatRoutes.js
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat_controller");
const validateMessage = require("../middlewares/validateMessage");
const validateGroup = require("../middlewares/validateGroup");

// Group routes
router.post("/groups", validateGroup, chatController.createGroup); // POST cần validate
router.put(
  "/groups/:groupId/members",
  validateGroup,
  chatController.addGroupMember
); // PUT cần validate
router.get("/groups/:groupId", chatController.getGroupById); // GET không cần validate body
router.get("/users/:userId/groups", chatController.getUserGroups); // GET không cần validate body
router.put(
  "/groups/:groupId/admins",
  validateGroup,
  chatController.addGroupAdmin
); // PUT cần validate
router.delete(
  "/groups/:groupId/admins",
  validateGroup,
  chatController.removeGroupAdmin
); // DELETE cần validate
router.delete("/groups/:groupId", validateGroup, chatController.removeGroup); // DELETE cần validate
router.delete(
  "/groups/:groupId/members",
  validateGroup,
  chatController.removeGroupMember
); // DELETE cần validate
router.get("/groups", chatController.getAllGroups); // GET không cần validate body
router.get("/groups/:groupId/members", chatController.getGroupMembers); // GET không cần validate body

// Message routes
router.post("/messages", validateMessage, chatController.sendMessage); // POST cần validate
// Bỏ validateMessage cho GET messages, có thể thêm middleware kiểm tra quyền truy cập sau
router.get("/groups/:groupId/messages", chatController.getGroupMessages);
// Thêm yêu cầu groupId vào query cho DELETE và PUT
router.delete("/messages/:messageId", chatController.deleteMessage); // Validate có thể thêm sau nếu cần
router.put(
  "/messages/:messageId",
  validateMessage,
  chatController.updateMessage
); // PUT cần validate body (text)

module.exports = router;
