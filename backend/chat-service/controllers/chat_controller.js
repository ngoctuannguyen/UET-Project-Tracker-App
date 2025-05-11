const Group = require("../models/groupModel");
const Message = require("../models/messageModel");

const chatController = {
  // Create a new group
  createGroup: async (req, res) => {
    try {
      // Assuming req.body contains { group_name: "...", members: ["id1", "id2"], create_by: "creatorId", admin: ["adminId1"] }
      const group = await Group.create(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add a member to a group
  addGroupMember: async (req, res) => {
    try {
      // Assuming req.body contains { member: "memberIdToAdd" }
      const group = await Group.addMember(req.params.groupId, req.body.member);
      res.json(group);
    } catch (error) {
      console.error("Error adding group member:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get group by ID
  getGroupById: async (req, res) => {
    try {
      const group = await Group.getById(req.params.groupId);
      res.json(group);
    } catch (error) {
      console.error("Error getting group by ID:", error);
      if (error.message === "Group not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get member IDs of a group
  getGroupMembers: async (req, res) => {
    try {
      // Calls the updated getMemberIds function
      const memberIds = await Group.getMemberIds(req.params.groupId);
      res.json(memberIds); // Returns an array of strings (user IDs)
    } catch (error) {
      console.error("Error getting group members:", error);
      if (error.message === "Group not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get all groups for a specific user
  getUserGroups: async (req, res) => {
    try {
      const groups = await Group.getByUser(req.params.userId);
      res.json(groups);
    } catch (error) {
      console.error("Error getting user groups:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add an admin to a group
  addGroupAdmin: async (req, res) => {
    try {
      // Assuming req.body contains { admin: "adminIdToAdd" }
      const group = await Group.addAdmin(req.params.groupId, req.body.admin);
      res.json(group);
    } catch (error) {
      console.error("Error adding group admin:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Remove an admin from a group
  removeGroupAdmin: async (req, res) => {
    try {
      // Assuming req.body contains { admin: "adminIdToRemove" }
      const group = await Group.removeAdmin(req.params.groupId, req.body.admin);
      res.json(group);
    } catch (error) {
      console.error("Error removing group admin:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Remove a group
  removeGroup: async (req, res) => {
    try {
      await Group.removeGroup(req.params.groupId);
      res.json({ message: "Group removed successfully" });
    } catch (error) {
      console.error("Error removing group:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Remove a member from a group
  removeGroupMember: async (req, res) => {
    try {
      // Assuming req.body contains { member: "memberIdToRemove" }
      const group = await Group.removeMember(
        req.params.groupId,
        req.body.member
      );
      res.json(group);
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all groups
  getAllGroups: async (req, res) => {
    try {
      const groups = await Group.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error getting all groups:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Send a message
  sendMessage: async (req, res) => {
    try {
      // Assuming req.body contains { group_id, sender_id, sender_name, text }
      const message = await Message.create(req.body);
      // Note: Socket handler will emit the message, this just confirms saving
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all messages for a specific group
  getGroupMessages: async (req, res) => {
    try {
      const messages = await Message.getByGroup(req.params.groupId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting group messages:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      // Assuming groupId is passed as a query parameter
      const { groupId } = req.query;
      if (!groupId) {
        return res
          .status(400)
          .json({ error: "Missing groupId query parameter" });
      }
      await Message.deleteMessage(groupId, req.params.messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update a message
  updateMessage: async (req, res) => {
    try {
      // Assuming groupId is passed as a query parameter
      const { groupId } = req.query;
      if (!groupId) {
        return res
          .status(400)
          .json({ error: "Missing groupId query parameter" });
      }
      // Assuming req.body contains { text: "new content" }
      const updatedData = { text: req.body.text };
      if (!updatedData.text) {
        return res
          .status(400)
          .json({ error: "Missing text field in request body" });
      }
      const updatedMessage = await Message.updateMessage(
        groupId,
        req.params.messageId,
        updatedData
      );
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = chatController;
