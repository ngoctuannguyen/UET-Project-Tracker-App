// middleware/validateGroup.js
const validateGroup = (req, res, next) => {
    const { group_name, admin , members} = req.body;
  
    // Kiểm tra trường bắt buộc
    if (!group_name || !admin) {
      return res.status(400).json({
        error: "Thiếu trường bắt buộc: groupName hoặc adminId",
      });
    }
    
    if (group_name.trim().length < 3) {
      return res.status(400).json({
        error: "Tên nhóm phải có ít nhất 3 ký tự",
      });
    }
  
    next(); 
  };
  
module.exports = validateGroup;