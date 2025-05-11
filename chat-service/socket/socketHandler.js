const Message = require("../models/messageModel"); // <<< THÊM DÒNG NÀY

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected`);

    socket.on("join-group", (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.id} joined group ${groupId}`);
    });

    socket.on("send-message", async (messageData) => {
      try {
        // messageData nên chứa: group_id, sender_id, sender_name, text
        if (
          !messageData.group_id ||
          !messageData.sender_id ||
          !messageData.sender_name ||
          !messageData.text
        ) {
          console.error(
            "Error handling message: Missing required fields in messageData",
            messageData
          );
          socket.emit("error", {
            message: "Failed to send message",
            details: "Missing required fields.",
          });
          return;
        }
        // Tạo tin nhắn và lưu vào Firestore thông qua Model
        const savedMessage = await Message.create(messageData);

        // Phát tin nhắn đã lưu (bao gồm cả timestamp từ server và ID tin nhắn)
        // cho tất cả client trong phòng chat (bao gồm cả người gửi)
        io.to(messageData.group_id).emit("new-message", savedMessage);
        console.log("Message saved and broadcasted:", savedMessage);
      } catch (error) {
        console.error("Error handling message:", error.message, error.stack);
        // Gửi lỗi về cho client gửi tin nhắn (nếu cần)
        socket.emit("error", {
          message: "Failed to send message",
          details: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected`);
    });
  });
};
