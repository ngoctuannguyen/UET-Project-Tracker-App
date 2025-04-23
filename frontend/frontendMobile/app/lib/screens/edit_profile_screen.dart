import 'package:flutter/material.dart';
// ... các import khác nếu có ...

// <<< ĐỔI TÊN CLASS >>>
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({Key? key}) : super(key: key);

  @override
  // <<< ĐỔI TÊN STATE CLASS >>>
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

// <<< ĐỔI TÊN STATE CLASS >>>
class _EditProfileScreenState extends State<EditProfileScreen> {
  // ... (Toàn bộ code state giữ nguyên: _hoTen, _maNhanVien, controllers, dialogs, buildEditableField, buildReadOnlyField, _saveProfileChanges) ...
  // --- GIỮ NGUYÊN TOÀN BỘ LOGIC STATE VÀ CÁC HÀM BÊN TRONG ---
  // Biến state để lưu trữ thông tin (thay bằng dữ liệu thực tế)
  String _hoTen = "Nguyễn Văn A";
  final String _maNhanVien = "NV001"; // Mã NV thường không đổi
  String _ngaySinh = "01/01/1990";
  String _gioiTinh = "Nam";
  String _email = "a.nguyenvan@example.com";

  // Controller cho các dialog chỉnh sửa
  final TextEditingController _editController = TextEditingController();
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  @override
  void dispose() {
    _editController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Hàm hiển thị dialog chỉnh sửa thông tin chung
  Future<void> _showEditDialog(
    String fieldLabel,
    String currentValue,
    Function(String) onSave,
  ) async {
    _editController.text = ''; // Xóa text cũ
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // Người dùng phải nhấn nút
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Chỉnh sửa $fieldLabel'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text('$fieldLabel hiện tại:'),
                Text(
                  currentValue,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 15),
                TextField(
                  controller: _editController,
                  decoration: InputDecoration(
                    labelText: '$fieldLabel mới',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Hủy'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Lưu'),
              onPressed: () {
                if (_editController.text.isNotEmpty) {
                  onSave(_editController.text);
                  Navigator.of(context).pop();
                } else {
                  // Có thể hiển thị thông báo lỗi nếu cần
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Vui lòng nhập thông tin mới'),
                    ),
                  );
                }
              },
            ),
          ],
        );
      },
    );
  }

  // Hàm hiển thị dialog thay đổi mật khẩu
  Future<void> _showChangePasswordDialog() async {
    _currentPasswordController.text = '';
    _newPasswordController.text = '';
    _confirmPasswordController.text = '';
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Thay đổi mật khẩu'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                TextField(
                  controller: _currentPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Mật khẩu hiện tại',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 15),
                TextField(
                  controller: _newPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Mật khẩu mới',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 15),
                TextField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Xác nhận mật khẩu mới',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Hủy'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Lưu'),
              onPressed: () {
                // Kiểm tra input
                if (_currentPasswordController.text.isEmpty ||
                    _newPasswordController.text.isEmpty ||
                    _confirmPasswordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Vui lòng nhập đầy đủ thông tin'),
                    ),
                  );
                  return;
                }
                if (_newPasswordController.text !=
                    _confirmPasswordController.text) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Mật khẩu mới không khớp')),
                  );
                  return;
                }

                // TODO: Gọi API để xác thực mật khẩu hiện tại và cập nhật mật khẩu mới
                print('Gọi API đổi mật khẩu...');
                print('MK hiện tại: ${_currentPasswordController.text}');
                print('MK mới: ${_newPasswordController.text}');

                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Yêu cầu đổi mật khẩu đã được gửi (giả lập)'),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }

  // Hàm build từng trường thông tin có thể chỉnh sửa
  Widget _buildEditableField({
    required String label,
    required String value,
    required VoidCallback onEditPressed,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
          const SizedBox(height: 5),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 15,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Text(value, style: const TextStyle(fontSize: 16)),
                ),
              ),
              IconButton(
                icon: Icon(Icons.edit_outlined, color: Colors.grey[600]),
                onPressed: onEditPressed,
                tooltip: 'Chỉnh sửa $label',
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Hàm build trường thông tin không thể chỉnh sửa
  Widget _buildReadOnlyField({required String label, required String value}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
          const SizedBox(height: 5),
          Container(
            width: double.infinity, // Chiếm hết chiều rộng
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 15),
            decoration: BoxDecoration(
              color: Colors.grey[200], // Màu nền khác cho read-only
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Text(value, style: const TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  // Hàm xử lý khi nhấn nút Lưu thay đổi
  void _saveProfileChanges() {
    // TODO: Gọi API để lưu các thay đổi (_hoTen, _ngaySinh, _gioiTinh, _email)
    print('Gọi API lưu thông tin hồ sơ...');
    print('Họ tên: $_hoTen');
    print('Ngày sinh: $_ngaySinh');
    print('Giới tính: $_gioiTinh');
    print('Email: $_email');

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Đã lưu thay đổi (giả lập)')));
    // Quay lại màn hình Settings sau khi lưu thành công
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // <<< CẬP NHẬT APPBAR >>>
      appBar: AppBar(
        title: const Text(
          'Chỉnh sửa Hồ sơ',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.tealAccent[100]!, Colors.teal],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        // Nút back sẽ tự động xuất hiện do được push từ SettingsScreen
        // leading: IconButton(
        //   icon: const Icon(Icons.arrow_back, color: Colors.white),
        //   onPressed: () => Navigator.of(context).pop(),
        // ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.teal[100]!, Colors.purple[100]!],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: ListView(
          children: [
            // Phần header với ảnh đại diện (giữ nguyên)
            Container(
              padding: const EdgeInsets.only(top: 20, bottom: 20),
              child: Center(
                child: CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.white,
                  backgroundImage: const NetworkImage(
                    'https://via.placeholder.com/150',
                  ),
                  onBackgroundImageError: (_, __) {},
                  child: const Icon(Icons.person, size: 50, color: Colors.grey),
                ),
              ),
            ),
            // Phần form thông tin trong container bo tròn (giữ nguyên)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 15.0),
              padding: const EdgeInsets.all(20.0),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(20.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildEditableField(
                    label: 'Họ và tên',
                    value: _hoTen,
                    onEditPressed:
                        () => _showEditDialog('Họ và tên', _hoTen, (newValue) {
                          setState(() => _hoTen = newValue);
                        }),
                  ),
                  _buildReadOnlyField(
                    label: 'Mã nhân viên',
                    value: _maNhanVien,
                  ),
                  _buildEditableField(
                    label: 'Ngày sinh',
                    value: _ngaySinh,
                    onEditPressed:
                        () =>
                            _showEditDialog('Ngày sinh', _ngaySinh, (newValue) {
                              setState(() => _ngaySinh = newValue);
                            }),
                  ),
                  _buildEditableField(
                    label: 'Giới tính',
                    value: _gioiTinh,
                    onEditPressed:
                        () =>
                            _showEditDialog('Giới tính', _gioiTinh, (newValue) {
                              setState(() => _gioiTinh = newValue);
                            }),
                  ),
                  _buildEditableField(
                    label: 'Email',
                    value: _email,
                    onEditPressed:
                        () => _showEditDialog('Email', _email, (newValue) {
                          setState(() => _email = newValue);
                        }),
                  ),
                  const Divider(height: 30),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.lock_outline, color: Colors.grey[700]),
                    title: const Text('Thay đổi mật khẩu'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: _showChangePasswordDialog,
                  ),
                ],
              ),
            ),
            // Nút Lưu thay đổi (giữ nguyên)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 30.0,
                vertical: 30.0,
              ),
              child: ElevatedButton(
                onPressed: _saveProfileChanges,
                child: const Text('Lưu các thay đổi'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
