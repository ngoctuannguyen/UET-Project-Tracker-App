const Group = require('../models/groupModel');
const Message = require('../models/messageModel');

const chatController = {
  // Create a new group
    createGroup: async (req, res) => {
        try {
            const group = await Group.create(req.body);
            res.status(201).json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addGroupMember: async (req, res) => {
        try {
            const group = await Group.addMember(req.params.groupId, req.body.member);
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get group by ID
    getGroupById: async (req, res) => {
        try {
            const group = await Group.getById(req.params.groupId);
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getGroupMembers: async (req, res) => {
        try {
            const members = await Group.getGroupMembers(req.params.groupId);
            res.json(members);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all groups for a user
    getUserGroups: async (req, res) => {
        try {
            const groups = await Group.getByUser(req.params.userId);
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Add an admin to a group
    addGroupAdmin: async (req, res) => {
        try {
            const group = await Group.addAdmin(req.params.groupId, req.body.admin);
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Remove an admin from a group
    removeGroupAdmin: async (req, res) => {
        try {
            const group = await Group.removeAdmin(req.params.groupId, req.body.admin);
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Remove a group
    removeGroup: async (req, res) => {
        try {
            await Group.removeGroup(req.params.groupId);
            res.json({ message: 'Group removed successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Remove a member from a group
    removeGroupMember: async (req, res) => {
        try {
            const group = await Group.removeMember(req.params.groupId, req.body.member);
            res.json(group);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all groups
    getAllGroups: async (req, res) => {
        try {
            const groups = await Group.getAllGroups();
            res.json(groups);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

  // Send a message
    sendMessage: async (req, res) => {
        try {
            const message = await Message.create(req.body);
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all messages for a specific group
    getGroupMessages: async (req, res) => {
        try {
            const messages = await Message.getByGroup(req.params.groupId);
            console.log(messages);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a message
    deleteMessage: async (req, res) => {
        try {
            await Message.deleteMessage(req.params.messageId);
            res.json({ message: 'Message deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a message
    updateMessage: async (req, res) => {
        try {
            const updatedMessage = await Message.updateMessage(req.params.messageId, req.body);
            res.json(updatedMessage);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = chatController;