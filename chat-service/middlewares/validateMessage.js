// middleware/validateMessage.js
const validateMessage = (req, res, next) => {
    const { groupId, text, senderId } = req.body;
  
    // Kiểm tra trường bắt buộc
    if (!groupId || !text || !senderId) {
        return res.status(400).json({
            error: "Thiếu trường bắt buộc: groupId, text hoặc senderId",
        });
    }
  
    // Kiểm tra kiểu dữ liệu
    if (
      typeof groupId !== "string" ||
      typeof text !== "string" ||
      typeof senderId !== "string"
    ) {
        return res.status(400).json({
            error: "groupId, text và senderId phải là chuỗi",
        });
    }
  
    // Kiểm tra nội dung tin nhắn
    if (text.trim().length === 0) {
        return res.status(400).json({
            error: "Tin nhắn không được trống",
        });
    }
  
    next(); // Cho phép request tiếp tục
  };
  
module.exports = validateMessage;