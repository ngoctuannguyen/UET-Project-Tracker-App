// filepath: d:\UET-Project-Tracker-App\backend\chat-service\models\messageModel.js
const { chat_service } = require("../services/firebase");
const admin = require("firebase-admin");

class Message {
  static async create(messageData) {
    const groupId = messageData.group_id;
    // Sử dụng ID duy nhất hơn thay vì chỉ Date.now() để tránh trùng lặp tiềm ẩn
    const messageId = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const messageRef = chat_service
      .doc(groupId)
      .collection("messages")
      .doc(messageId);
    await messageRef.set({
      sender_id: messageData.sender_id,
      sender_name: messageData.sender_name, // Đảm bảo sender_name được gửi từ client
      text: messageData.text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Trả về dữ liệu kèm ID của tin nhắn mới tạo
    const docSnapshot = await messageRef.get();
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }

  // Bỏ hàm getGroupMembers vì nó thuộc về Group Model

  static async getByGroup(groupId) {
    // Lấy tất cả documents trong subcollection 'messages' của group đó
    const snapshot = await chat_service
      .doc(groupId)
      .collection("messages")
      .orderBy("timestamp", "asc") // Sắp xếp theo thời gian
      .get();
    // Map dữ liệu và thêm ID của document vào kết quả
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Sửa deleteMessage - cần groupId và messageId
  static async deleteMessage(groupId, messageId) {
    const messageRef = chat_service
      .doc(groupId)
      .collection("messages")
      .doc(messageId);
    await messageRef.delete();
  }

  // Sửa updateMessage - cần groupId và messageId
  static async updateMessage(groupId, messageId, updatedData) {
    const messageRef = chat_service
      .doc(groupId)
      .collection("messages")
      .doc(messageId);
    // Chỉ cập nhật các trường được phép, ví dụ: text
    const dataToUpdate = {
      text: updatedData.text,
      // Có thể thêm trường last_updated_at nếu muốn
      // last_updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    await messageRef.update(dataToUpdate);
    const docSnapshot = await messageRef.get();
    return { id: docSnapshot.id, ...docSnapshot.data() };
  }
}

// ... (phần test có thể giữ hoặc bỏ) ...

module.exports = Message;
