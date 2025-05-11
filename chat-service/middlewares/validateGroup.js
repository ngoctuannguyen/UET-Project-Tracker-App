// middleware/validateGroup.js
const validateGroup = (req, res, next) => {
    const { groupName, admin , members} = req.body;
  
    // Kiểm tra trường bắt buộc
    if (!groupName || !admin) {
      return res.status(400).json({
        error: "Thiếu trường bắt buộc: groupName hoặc adminId",
      });
    }

    if (!members || members.length < 2) {
        return res.status(400).json({
            error: "Cần ít nhất 2 thành viên để tạo nhóm",
        });
    }
    
    if (req.method === "DELETE" && !members && members.length < 2 && admin.length < 2) {
        return res.status(400).json({
            error: "Không xóa nhóm được vì không có thành viên nào",
        });
    }
  
    // Kiểm tra độ dài
    if (groupName.trim().length < 3) {
      return res.status(400).json({
        error: "Tên nhóm phải có ít nhất 3 ký tự",
      });
    }
  
    next(); // Cho phép request tiếp tục nếu hợp lệ
  };
  
module.exports = validateGroup;