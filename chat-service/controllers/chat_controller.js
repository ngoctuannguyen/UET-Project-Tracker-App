const Group = require("../models/groupModel");
const Message = require("../models/messageModel");

const chatController = {
  createGroup: async (req, res) => {
    try {
      const creatorId = req.user.uid; // Lấy UID từ người dùng đã xác thực
      const groupName = req.body.group_name;
      let members = req.body.members || [];
      let groupAdmins = req.body.admin || []; // Trường admin trong group document

      if (!groupName || groupName.trim() === "") {
        return res.status(400).json({ error: "Group name is required." });
      }

      // Đảm bảo người tạo luôn là thành viên
      if (!members.includes(creatorId)) {
        members.push(creatorId);
      }
      // Người tạo có thể mặc định là admin của nhóm (tùy logic của bạn)
      if (!groupAdmins.includes(creatorId)) {
        groupAdmins.push(creatorId);
      }

      const groupData = {
        group_name: groupName,
        members: [...new Set(members)], // Loại bỏ trùng lặp
        admin: [...new Set(groupAdmins)], // Loại bỏ trùng lặp
        created_by: creatorId,
        created_at: new Date(), // Thêm timestamp khi tạo
      };

      const group = await Group.create(groupData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res
        .status(500)
        .json({ error: "Failed to create group: " + error.message });
    }
  },

  createGroupInternal: async (req, res) => {
    try {
      const groupName = req.body.group_name;
      const creatorId = req.body.uid;
      let members = req.body.members || [];
      let groupAdmins = req.body.admin || []; // Trường admin trong group document

      if (!groupName || groupName.trim() === "") {
        return res.status(400).json({ error: "Group name is required." });
      }

      // Đảm bảo người tạo luôn là thành viên
      if (!members.includes(creatorId)) {
        members.push(creatorId);
      }
      // Người tạo có thể mặc định là admin của nhóm (tùy logic của bạn)
      if (!groupAdmins.includes(creatorId)) {
        groupAdmins.push(creatorId);
      }

      const groupData = {
        group_name: groupName,
        members: [...new Set(members)], // Loại bỏ trùng lặp
        admin: [...new Set(groupAdmins)], // Loại bỏ trùng lặp
        created_by: creatorId,
        created_at: new Date(),
        group_id: req.body.group_id
      };

      const group = await Group.create(groupData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res
        .status(500)
        .json({ error: "Failed to create group: " + error.message });
    }
  },

  addGroupMember: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const memberIdToAdd = req.body.member; // UID của người cần thêm
      const requestingUserUid = req.user.uid;

      if (!memberIdToAdd) {
        return res.status(400).json({ error: "Member ID to add is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền: Chỉ admin của nhóm mới được thêm thành viên
      if (!groupDoc.admin || !groupDoc.admin.includes(requestingUserUid)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Only group admins can add members." });
      }

      // Kiểm tra xem người dùng đã là thành viên chưa
      if (groupDoc.members && groupDoc.members.includes(memberIdToAdd)) {
        return res
          .status(400)
          .json({ error: "User is already a member of this group." });
      }

      const updatedGroup = await Group.addMember(groupId, memberIdToAdd);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding group member:", error);
      res
        .status(500)
        .json({ error: "Failed to add group member: " + error.message });
    }
  },

  addGroupMemberInternal: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const memberIdToAdd = req.body.member; // UID của người cần thêm

      if (!memberIdToAdd) {
        return res.status(400).json({ error: "Member ID to add is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền: Chỉ admin của nhóm mới được thêm thành viên
      // if (!groupDoc.admin || !groupDoc.admin.includes(requestingUserUid)) {
      //   return res
      //     .status(403)
      //     .json({ error: "Forbidden: Only group admins can add members." });
      // }

      // Kiểm tra xem người dùng đã là thành viên chưa
      if (groupDoc.members && groupDoc.members.includes(memberIdToAdd)) {
        return res
          .status(400)
          .json({ error: "User is already a member of this group." });
      }

      const updatedGroup = await Group.addMember(groupId, memberIdToAdd);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding group member:", error);
      res
        .status(500)
        .json({ error: "Failed to add group member: " + error.message });
    }
  },

  getGroupById: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const requestingUserUid = req.user.uid;

      const group = await Group.getById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Người dùng phải là thành viên (hoặc admin của nhóm, nếu admin cũng là member) để xem thông tin nhóm
      if (!group.members || !group.members.includes(requestingUserUid)) {
        return res.status(403).json({
          error: "Forbidden: You are not authorized to view this group.",
        });
      }
      res.json(group);
    } catch (error) {
      console.error("Error getting group by ID:", error);
      if (error.message.toLowerCase().includes("not found")) {
        return res.status(404).json({ error: "Group not found." });
      }
      res.status(500).json({ error: "Failed to get group: " + error.message });
    }
  },

  getGroupMembers: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const requestingUserUid = req.user.uid;

      const group = await Group.getById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      if (!group.members || !group.members.includes(requestingUserUid)) {
        return res.status(403).json({
          error:
            "Forbidden: You are not authorized to view members of this group.",
        });
      }

      // Group.getMemberIds nên trả về danh sách UID của các thành viên
      const memberIds = await Group.getMemberIds(groupId);
      res.json(memberIds || []); // Trả về mảng rỗng nếu không có members
    } catch (error) {
      console.error("Error getting group members:", error);
      if (error.message.toLowerCase().includes("not found")) {
        return res.status(404).json({ error: "Group not found." });
      }
      res
        .status(500)
        .json({ error: "Failed to get group members: " + error.message });
    }
  },
  getUserGroups: async (req, res) => {
    try {
      // UID này nên được lấy từ authMiddleware, không phải từ params nếu bạn muốn bảo mật
      // Nếu bạn đang lấy từ req.user.uid (do authMiddleware gán vào) thì tốt
      const requestingUserUid = req.user?.uid || req.params.userId; // Ưu tiên req.user.uid nếu có

      console.log(
        `[chat_controller.js] getUserGroups - Received request for user UID: ${requestingUserUid}`
      );

      if (!requestingUserUid) {
        console.error(
          "[chat_controller.js] getUserGroups - Error: User UID is missing."
        );
        return res.status(400).json({ message: "User UID is required." });
      }

      const groups = await Group.getByUser(requestingUserUid);
      console.log(
        `[chat_controller.js] getUserGroups - Groups found by model for user ${requestingUserUid}:`,
        JSON.stringify(groups, null, 2)
      );

      if (!groups) {
        // Kiểm tra nếu model trả về null/undefined (dù thường là mảng rỗng)
        console.log(
          `[chat_controller.js] getUserGroups - No groups array returned from model for user ${requestingUserUid}.`
        );
        return res.status(200).json([]);
      }

      res.status(200).json(groups);
    } catch (error) {
      console.error(
        "[chat_controller.js] getUserGroups - Error fetching user groups:",
        error
      );
      res
        .status(500)
        .json({ message: "Error fetching user groups", error: error.message });
    }
  },

   getUserGroupsWOAuth: async (req, res) => {
    try {
      // UID này nên được lấy từ authMiddleware, không phải từ params nếu bạn muốn bảo mật
      // Nếu bạn đang lấy từ req.user.uid (do authMiddleware gán vào) thì tốt
      const requestingUserUid = req.user?.uid || req.params.userId; // Ưu tiên req.user.uid nếu có

      console.log(
        `[chat_controller.js] getUserGroups - Received request for user UID: ${requestingUserUid}`
      );

      if (!requestingUserUid) {
        console.error(
          "[chat_controller.js] getUserGroups - Error: User UID is missing."
        );
        return res.status(400).json({ message: "User UID is required." });
      }

      const groups = await Group.getByUser(requestingUserUid);
      console.log(
        `[chat_controller.js] getUserGroups - Groups found by model for user ${requestingUserUid}:`,
        JSON.stringify(groups, null, 2)
      );

      if (!groups) {
        // Kiểm tra nếu model trả về null/undefined (dù thường là mảng rỗng)
        console.log(
          `[chat_controller.js] getUserGroups - No groups array returned from model for user ${requestingUserUid}.`
        );
        return res.status(200).json([]);
      }

      res.status(200).json(groups);
    } catch (error) {
      console.error(
        "[chat_controller.js] getUserGroups - Error fetching user groups:",
        error
      );
      res
        .status(500)
        .json({ message: "Error fetching user groups", error: error.message });
    }
  },

  addGroupAdmin: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const adminIdToAdd = req.body.admin; // UID của người cần thêm làm admin
      const requestingUserUid = req.user.uid;

      if (!adminIdToAdd) {
        return res.status(400).json({ error: "Admin ID to add is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền: Chỉ admin hiện tại của nhóm mới được thêm admin mới
      if (!groupDoc.admin || !groupDoc.admin.includes(requestingUserUid)) {
        return res.status(403).json({
          error: "Forbidden: Only current group admins can add new admins.",
        });
      }
      // Người được thêm làm admin cũng phải là thành viên của nhóm
      if (!groupDoc.members || !groupDoc.members.includes(adminIdToAdd)) {
        return res.status(400).json({
          error: "User to be made admin must be a member of the group.",
        });
      }
      if (groupDoc.admin && groupDoc.admin.includes(adminIdToAdd)) {
        return res
          .status(400)
          .json({ error: "User is already an admin of this group." });
      }

      const updatedGroup = await Group.addAdmin(groupId, adminIdToAdd);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding group admin:", error);
      res
        .status(500)
        .json({ error: "Failed to add group admin: " + error.message });
    }
  },

  removeGroupAdmin: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const adminIdToRemove = req.body.admin; // UID của admin cần xóa
      const requestingUserUid = req.user.uid;

      if (!adminIdToRemove) {
        return res
          .status(400)
          .json({ error: "Admin ID to remove is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền: Chỉ admin hiện tại của nhóm mới được xóa admin khác
      if (!groupDoc.admin || !groupDoc.admin.includes(requestingUserUid)) {
        return res.status(403).json({
          error:
            "Forbidden: Only current group admins can remove other admins.",
        });
      }
      // Không thể tự xóa mình nếu là admin cuối cùng (cần ít nhất 1 admin)
      if (
        groupDoc.admin &&
        groupDoc.admin.length === 1 &&
        groupDoc.admin.includes(adminIdToRemove) &&
        adminIdToRemove === requestingUserUid
      ) {
        return res.status(400).json({
          error: "Cannot remove the last admin. Assign another admin first.",
        });
      }
      if (!groupDoc.admin || !groupDoc.admin.includes(adminIdToRemove)) {
        return res
          .status(400)
          .json({ error: "User is not an admin of this group." });
      }

      const updatedGroup = await Group.removeAdmin(groupId, adminIdToRemove);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error removing group admin:", error);
      res
        .status(500)
        .json({ error: "Failed to remove group admin: " + error.message });
    }
  },
  
  removeGroup: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const requestingUserUid = req.user.uid;

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền: Chỉ admin của nhóm mới được xóa nhóm
      if (!groupDoc.admin || !groupDoc.admin.includes(requestingUserUid)) {
        return res.status(403).json({
          error: "Forbidden: Only group admins can remove the group.",
        });
      }

      await Group.removeGroup(groupId);
      res.json({ message: "Group removed successfully." });
    } catch (error) {
      console.error("Error removing group:", error);
      res
        .status(500)
        .json({ error: "Failed to remove group: " + error.message });
    }
  },

  removeGroupMember: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const memberIdToRemove = req.body.member; // UID của người cần xóa
      const requestingUserUid = req.user.uid;

      if (!memberIdToRemove) {
        return res
          .status(400)
          .json({ error: "Member ID to remove is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền:
      // 1. Admin của nhóm có thể xóa bất kỳ thành viên nào (trừ khi đó là admin cuối cùng và đang cố xóa chính mình)
      // 2. Thành viên có thể tự xóa mình khỏi nhóm
      const isRequestingUserAdmin =
        groupDoc.admin && groupDoc.admin.includes(requestingUserUid);

      if (requestingUserUid === memberIdToRemove) {
        // User tự rời nhóm
        // Kiểm tra nếu user tự rời là admin cuối cùng
        if (
          groupDoc.admin &&
          groupDoc.admin.includes(memberIdToRemove) &&
          groupDoc.admin.length === 1
        ) {
          return res.status(400).json({
            error:
              "Cannot leave group as the last admin. Assign another admin first or delete the group.",
          });
        }
      } else if (!isRequestingUserAdmin) {
        // Người khác xóa member, người yêu cầu phải là admin
        return res.status(403).json({
          error: "Forbidden: Only group admins can remove other members.",
        });
      }

      if (!groupDoc.members || !groupDoc.members.includes(memberIdToRemove)) {
        return res
          .status(400)
          .json({ error: "User is not a member of this group." });
      }

      const updatedGroup = await Group.removeMember(groupId, memberIdToRemove);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error removing group member:", error);
      res
        .status(500)
        .json({ error: "Failed to remove group member: " + error.message });
    }
  },

  removeGroupMemberInternal: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const memberIdToRemove = req.body.member; // UID của người cần xóa

      if (!memberIdToRemove) {
        return res
          .status(400)
          .json({ error: "Member ID to remove is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // Logic kiểm tra quyền:
      // 1. Admin của nhóm có thể xóa bất kỳ thành viên nào (trừ khi đó là admin cuối cùng và đang cố xóa chính mình)
      // 2. Thành viên có thể tự xóa mình khỏi nhóm
      // const isRequestingUserAdmin =
      //   groupDoc.admin && groupDoc.admin.includes(requestingUserUid);

      // if (requestingUserUid === memberIdToRemove) {
      //   // User tự rời nhóm
      //   // Kiểm tra nếu user tự rời là admin cuối cùng
      //   if (
      //     groupDoc.admin &&
      //     groupDoc.admin.includes(memberIdToRemove) &&
      //     groupDoc.admin.length === 1
      //   ) {
      //     return res.status(400).json({
      //       error:
      //         "Cannot leave group as the last admin. Assign another admin first or delete the group.",
      //     });
      //   }
      // } else if (!isRequestingUserAdmin) {
      //   // Người khác xóa member, người yêu cầu phải là admin
      //   return res.status(403).json({
      //     error: "Forbidden: Only group admins can remove other members.",
      //   });
      // }

      if (!groupDoc.members || !groupDoc.members.includes(memberIdToRemove)) {
        return res
          .status(400)
          .json({ error: "User is not a member of this group." });
      }

      const updatedGroup = await Group.removeMember(groupId, memberIdToRemove);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error removing group member:", error);
      res
        .status(500)
        .json({ error: "Failed to remove group member: " + error.message });
    }
  },

  changeAdmin: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const adminToChange = req.body.admin; // UID của người cần xóa

      if (!adminToChange) {
        return res.status(400).json({ error: "Admin ID is required." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found." });
      }

      // if (!groupDoc.members || !groupDoc.members.includes(adminToChange)) {
      //   return res
      //     .status(400)
      //     .json({ error: "User is not a member of this group." });
      // }

      const updatedGroup = await Group.changeAdmin(groupId, adminToChange);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error removing group member:", error);
      res
        .status(500)
        .json({ error: "Failed to remove group member: " + error.message });
    }
  },

  getAllGroups: async (req, res) => {
    // Route này rất nhạy cảm. Chỉ nên cho phép nếu có vai trò system admin thực sự.
    // Theo mô tả của bạn, không "management" hay "user" nào có quyền này.
    // console.warn("Attempt to access getAllGroups by user:", req.user.uid);
    // if (req.user.role !== 'SUPER_ADMIN') { // Giả sử có một vai trò đặc biệt
    //   return res.status(403).json({ error: "Forbidden: You are not authorized to access all groups." });
    // }
    try {
      // Tạm thời comment out để tránh lộ dữ liệu, chỉ bật khi có cơ chế phân quyền SUPER_ADMIN rõ ràng
      // const groups = await Group.getAllGroups();
      // res.json(groups);
      return res.status(403).json({
        error: "Forbidden: Access to all groups is currently restricted.",
      });
    } catch (error) {
      console.error("Error getting all groups:", error);
      res
        .status(500)
        .json({ error: "Failed to get all groups: " + error.message });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const groupId = req.params.groupId; // Lấy groupId từ params route
      const requestingUserUid = req.user.uid;
      // Lấy tên từ token (Firebase Auth token thường có 'name' hoặc bạn có thể query từ user_service nếu cần)
      const senderNameFromToken =
        req.user.name ||
        req.user.displayName ||
        "User " + requestingUserUid.substring(0, 5);

      const text = req.body.text;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Message text cannot be empty." });
      }

      const group = await Group.getById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      if (!group.members || !group.members.includes(requestingUserUid)) {
        return res.status(403).json({
          error:
            "Forbidden: You are not a member of this group and cannot send messages.",
        });
      }

      const messageData = {
        group_id: groupId,
        text: text,
        sender_id: requestingUserUid, // Luôn lấy từ người dùng đã xác thực
        sender_name: senderNameFromToken, // Lấy từ thông tin token
        // timestamp sẽ được model hoặc Firestore tự động thêm
      };

      const message = await Message.create(messageData);
      // Socket handler (trong socketHandler.js) sẽ chịu trách nhiệm emit tin nhắn này
      // đến các client khác trong group. API này chỉ xác nhận việc lưu.
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res
        .status(500)
        .json({ error: "Failed to send message: " + error.message });
    }
  },

  getGroupMessages: async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const requestingUserUid = req.user.uid;

      const group = await Group.getById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found." });
      }

      if (!group.members || !group.members.includes(requestingUserUid)) {
        return res.status(403).json({
          error:
            "Forbidden: You are not authorized to view messages for this group.",
        });
      }

      const messages = await Message.getByGroup(groupId);
      res.json(messages || []);
    } catch (error) {
      console.error("Error getting group messages:", error);
      if (error.message.toLowerCase().includes("not found")) {
        return res
          .status(404)
          .json({ error: "Group not found or no messages." });
      }
      res
        .status(500)
        .json({ error: "Failed to get group messages: " + error.message });
    }
  },

  deleteMessage: async (req, res) => {
    try {
      const groupId = req.params.groupId; // Lấy groupId từ params route
      const messageId = req.params.messageId;
      const requestingUserUid = req.user.uid;

      const messageDoc = await Message.getById(groupId, messageId); // Cần hàm getById trong MessageModel
      if (!messageDoc) {
        return res.status(404).json({ error: "Message not found." });
      }

      const groupDoc = await Group.getById(groupId);
      if (!groupDoc) {
        return res.status(404).json({ error: "Associated group not found." }); // Lỗi lạ nếu message tồn tại mà group không
      }

      const isSender = messageDoc.sender_id === requestingUserUid;
      const isGroupAdmin =
        groupDoc.admin && groupDoc.admin.includes(requestingUserUid);

      // Chỉ người gửi hoặc admin của nhóm mới được xóa tin nhắn
      if (!isSender && !isGroupAdmin) {
        return res.status(403).json({
          error:
            "Forbidden: You can only delete your own messages or if you are a group admin.",
        });
      }

      await Message.deleteMessage(groupId, messageId);
      res.json({ message: "Message deleted successfully." });
    } catch (error) {
      console.error("Error deleting message:", error);
      res
        .status(500)
        .json({ error: "Failed to delete message: " + error.message });
    }
  },

  updateMessage: async (req, res) => {
    try {
      const groupId = req.params.groupId; // Lấy groupId từ params route
      const messageId = req.params.messageId;
      const requestingUserUid = req.user.uid;
      const updatedText = req.body.text;

      if (!updatedText || updatedText.trim() === "") {
        return res
          .status(400)
          .json({ error: "Message text for update cannot be empty." });
      }

      const messageDoc = await Message.getById(groupId, messageId); // Cần hàm getById trong MessageModel
      if (!messageDoc) {
        return res.status(404).json({ error: "Message not found." });
      }

      // Chỉ người gửi mới được sửa tin nhắn của họ
      if (messageDoc.sender_id !== requestingUserUid) {
        return res
          .status(403)
          .json({ error: "Forbidden: You can only update your own messages." });
      }

      // Có thể thêm giới hạn thời gian cho phép sửa tin nhắn ở đây nếu muốn

      const updatedMessage = await Message.updateMessage(groupId, messageId, {
        text: updatedText,
      });
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res
        .status(500)
        .json({ error: "Failed to update message: " + error.message });
    }
  },
};

module.exports = chatController;
