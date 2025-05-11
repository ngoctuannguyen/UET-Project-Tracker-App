const { chat_service } = require("../services/firebase");
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");

class Group {
  static async addMessageCollecttion(groupId) {
    const messageId = `${Date.now()}-system`;
    const messageRef = chat_service
      .doc(groupId)
      .collection("messages")
      .doc(messageId);
    await messageRef.set({
      sender_id: "system",
      sender_name: "System",
      text: "Group created",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  static async create(groupData) {
    const groupId = uuidv4(); // Sử dụng uuidv4 để tạo ID cho document
    const groupRef = chat_service.doc(groupId);

    const initialMembers = [...(groupData.members || []), groupData.create_by];
    const uniqueMembers = [...new Set(initialMembers.filter((id) => id))];
    const initialAdmins = [...(groupData.admin || []), groupData.create_by];
    const uniqueAdmins = [...new Set(initialAdmins.filter((id) => id))];

    await Group.addMessageCollecttion(groupId);

    const newGroupData = {
      group_id: groupId, // Lưu ID này trong document để tiện truy vấn nếu cần
      group_name: groupData.group_name,
      members: uniqueMembers,
      created_by: groupData.create_by,
      admin: uniqueAdmins,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await groupRef.set(newGroupData);

    // Trả về cả ID của document và dữ liệu của nó
    return { id: groupRef.id, ...newGroupData };
  }

  static async updateGroupName(groupId, newName) {
    const groupRef = chat_service.doc(groupId);
    await groupRef.update({
      group_name: newName,
    });
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found after update");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async addMember(groupId, memberId) {
    const groupRef = chat_service.doc(groupId);
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(memberId),
    });
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found after adding member");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async removeMember(groupId, memberId) {
    const groupRef = chat_service.doc(groupId);
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayRemove(memberId),
    });
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found after removing member");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async getByUser(userId) {
    const snapshot = await chat_service
      .where("members", "array-contains", userId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async addAdmin(groupId, adminId) {
    const groupRef = chat_service.doc(groupId);
    await groupRef.update({
      admin: admin.firestore.FieldValue.arrayUnion(adminId),
    });
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found after adding admin");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async removeAdmin(groupId, adminId) {
    const groupRef = chat_service.doc(groupId);
    await groupRef.update({
      admin: admin.firestore.FieldValue.arrayRemove(adminId),
    });
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found after removing admin");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async getById(groupId) {
    const groupRef = chat_service.doc(groupId);
    const docSnapshot = await groupRef.get();
    if (!docSnapshot.exists) {
      throw new Error("Group not found");
    }
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  static async getAllGroups() {
    const snapshot = await chat_service.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getMemberIds(groupId) {
    const groupRef = chat_service.doc(groupId);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new Error("Group not found");
    }
    return groupDoc.data().members || [];
  }

  static async removeGroup(groupId) {
    const groupRef = chat_service.doc(groupId);
    // Cân nhắc xóa subcollection 'messages' ở đây nếu cần
    // Ví dụ: await deleteCollectionRecursive(groupRef.collection('messages'));
    await groupRef.delete();
    return { id: groupId, message: "Group removed successfully" }; // Trả về thông báo
  }
}

module.exports = Group;
