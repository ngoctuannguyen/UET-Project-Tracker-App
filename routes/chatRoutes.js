const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat_controller');
const validateMessage = require('../middlewares/validateMessage');
const validateGroup = require('../middlewares/validateGroup');

// Group routes
router.post('/groups', validateGroup, chatController.createGroup);
router.put('/groups/:groupId/members', validateGroup, chatController.addGroupMember);
router.get('/groups/:groupId', validateGroup, chatController.getGroupById);
router.get('/users/:userId/groups', validateGroup, chatController.getUserGroups);
router.put('/groups/:groupId/admins', validateGroup, chatController.addGroupAdmin);
router.delete('/groups/:groupId/admins', validateGroup, chatController.removeGroupAdmin);
router.delete('/groups/:groupId', validateGroup, chatController.removeGroup);
router.delete('/groups/:groupId/members', validateGroup, chatController.removeGroupMember);
router.get('/groups', validateGroup, chatController.getAllGroups);
router.get('/groups/:groupId/members', validateGroup, chatController.getGroupMembers);

// Message routes
router.post('/messages', validateMessage, chatController.sendMessage);
router.get('/groups/:groupId/messages', validateMessage, chatController.getGroupMessages);
router.delete('/messages/:messageId', validateMessage, chatController.deleteMessage);
router.put('/messages/:messageId', validateMessage, chatController.updateMessage);

module.exports = router;