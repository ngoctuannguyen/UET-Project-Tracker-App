const Message = require("../models/messageModel");
const admin = require("firebase-admin");

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userIdFromQuery = socket.handshake.query.userId;
    console.log(
      `[SocketHandler] User ${socket.id} connected. Query UserID: ${
        userIdFromQuery || "N/A"
      }`
    );

    socket.on("join-group", (groupId) => {
      if (!groupId) {
        console.warn(
          `[SocketHandler] User ${socket.id} attempted to join a null/undefined group.`
        );
        return;
      }
      socket.join(groupId);
      console.log(
        `[SocketHandler] User ${socket.id} (Query UserID: ${
          userIdFromQuery || "N/A"
        }) joined group ${groupId}`
      );
    });

    socket.on("send-message", async (messageData) => {
      console.log(
        `[SocketHandler] SERVER RECEIVED 'send-message' from socket ${
          socket.id
        } (Query UserID: ${userIdFromQuery || "N/A"}). Data:`,
        JSON.stringify(messageData, null, 2)
      );

      const senderIdToUse = messageData.sender_id;
      const senderNameToUse = messageData.sender_name;

      if (
        !messageData.group_id ||
        !senderIdToUse ||
        !senderNameToUse ||
        !messageData.text ||
        messageData.text.trim() === ""
      ) {
        console.error(
          "[SocketHandler] Error handling message: Missing or invalid required fields in messageData.",
          messageData
        );
        socket.emit("send-message-error", {
          message: "Failed to send message",
          details:
            "Missing or invalid required fields (group_id, sender_id, sender_name, non-empty text).",
        });
        return;
      }

      try {
        const messagePayload = {
          group_id: messageData.group_id,
          sender_id: senderIdToUse,
          sender_name: senderNameToUse,
          text: messageData.text.trim(),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        console.log(
          "[SocketHandler] Attempting to save message with payload:",
          JSON.stringify(messagePayload, null, 2)
        );

        const savedMessage = await Message.create(messagePayload);

        if (!savedMessage || !savedMessage.id) {
          console.error(
            "[SocketHandler] Failed to save message or savedMessage is invalid (missing id). Result from Message.create:",
            savedMessage
          );
          socket.emit("send-message-error", {
            message: "Failed to send message",
            details:
              "Error saving message to database or invalid response from save operation.",
          });
          return;
        }

        // Tạo đối tượng tin nhắn để gửi cho client, đảm bảo nó chứa group_id
        const messageToSend = {
          ...savedMessage, // Chứa id, sender_id, sender_name, text, timestamp đã được server xử lý
          group_id: messageData.group_id, // Thêm group_id một cách tường minh từ request gốc
        };

        console.log(
          "[SocketHandler] Message to send to clients:",
          JSON.stringify(messageToSend, null, 2)
        );

        // Phát tin nhắn đến đúng group sử dụng messageData.group_id
        // và gửi đối tượng tin nhắn đã được bổ sung (messageToSend)
        io.to(messageData.group_id).emit("new-message", messageToSend);
        console.log(
          `[SocketHandler] SERVER EMITTED 'new-message' to group ${messageData.group_id}. Message ID: ${messageToSend.id}`
        );
      } catch (error) {
        console.error(
          "[SocketHandler] Error processing 'send-message':",
          error.message,
          error.stack
        );
        socket.emit("send-message-error", {
          message: "Failed to send message due to server error.",
          details: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(
        `[SocketHandler] User ${socket.id} (Query UserID: ${
          userIdFromQuery || "N/A"
        }) disconnected`
      );
    });

    socket.on("error", (err) => {
      console.error(
        `[SocketHandler] Socket error for user ${socket.id}:`,
        err.message,
        err.stack
      );
    });
  });
};
