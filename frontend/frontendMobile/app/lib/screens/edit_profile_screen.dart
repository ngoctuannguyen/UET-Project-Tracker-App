import 'package:flutter/material.dart';
import 'package:app/services/user_service.dart';
import 'package:app/models/user_model.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class EditProfileScreen extends StatefulWidget {
  // <<< SỬA: Nhận Document ID ('user1', 'user2') >>>
  final String docId;

  const EditProfileScreen({Key? key, required this.docId}) : super(key: key);

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final UserService _userService = UserService();
  UserModel? _originalUserData; // Dữ liệu gốc load từ Firestore
  bool _isLoading = true;
  bool _isSaving = false;

  // Biến state để lưu trữ thông tin đang chỉnh sửa
  String _hoTen = "";
  String _maNhanVienDisplay = ""; // Hiển thị user_id ('VNU1', 'VNU2')
  String _ngaySinh = "";
  String _gioiTinh = "";
  String _email = "";

  // Controllers giữ nguyên
  final TextEditingController _editController = TextEditingController();
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });

    // <<< SỬA: Load user bằng Document ID nhận được >>>
    UserModel? user = await _userService.getUserByDocId(widget.docId);

    if (mounted) {
      setState(() {
        _originalUserData = user; // Lưu lại UserModel gốc
        if (user != null) {
          // Khởi tạo giá trị cho các biến state từ user đã load
          _hoTen = user.fullName;
          _maNhanVienDisplay = user.userId; // Hiển thị field user_id ('VNU1')
          _ngaySinh = user.birthdayFormatted;
          _gioiTinh = user.gender ?? '';
          _email = user.email;
        }
        _isLoading = false;
      });
      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể tải thông tin người dùng để chỉnh sửa.'),
            backgroundColor: Colors.red,
          ),
        );
        // Cân nhắc pop màn hình nếu không load được user
        // Future.delayed(Duration(seconds: 1), () => Navigator.pop(context));
      }
    }
  }

  @override
  void dispose() {
    _editController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // Hàm _showEditDialog giữ nguyên
  Future<void> _showEditDialog(
    String fieldLabel,
    String currentValue,
    Function(String) onSave, {
    TextInputType keyboardType = TextInputType.text,
  }) async {
    _editController.text = '';
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Chỉnh sửa $fieldLabel'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text('$fieldLabel hiện tại:'),
                Text(
                  currentValue.isNotEmpty ? currentValue : 'Chưa cập nhật',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 15),
                TextField(
                  controller: _editController,
                  decoration: InputDecoration(
                    labelText: '$fieldLabel mới',
                    hintText: 'Nhập $fieldLabel mới',
                    border: const OutlineInputBorder(),
                  ),
                  keyboardType: keyboardType,
                  autofocus: true,
                ),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Hủy'),
              onPressed: () => Navigator.of(context).pop(),
            ),
            TextButton(
              child: const Text('Lưu'),
              onPressed: () {
                final newValue = _editController.text.trim();
                if (newValue.isNotEmpty) {
                  onSave(newValue);
                  Navigator.of(context).pop();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Vui lòng nhập thông tin mới'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
            ),
          ],
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15.0),
          ),
        );
      },
    );
  }

  // Hàm _showChangePasswordDialog giữ nguyên
  Future<void> _showChangePasswordDialog() async {
    _currentPasswordController.clear();
    _newPasswordController.clear();
    _confirmPasswordController.clear();
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        bool _obscureCurrent = true;
        bool _obscureNew = true;
        bool _obscureConfirm = true;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Thay đổi mật khẩu'),
              content: SingleChildScrollView(
                child: ListBody(
                  children: <Widget>[
                    TextField(
                      controller: _currentPasswordController,
                      obscureText: _obscureCurrent,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu hiện tại',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureCurrent
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed:
                              () => setDialogState(
                                () => _obscureCurrent = !_obscureCurrent,
                              ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    TextField(
                      controller: _newPasswordController,
                      obscureText: _obscureNew,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu mới',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureNew
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed:
                              () => setDialogState(
                                () => _obscureNew = !_obscureNew,
                              ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    TextField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirm,
                      decoration: InputDecoration(
                        labelText: 'Xác nhận mật khẩu mới',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureConfirm
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed:
                              () => setDialogState(
                                () => _obscureConfirm = !_obscureConfirm,
                              ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: <Widget>[
                TextButton(
                  child: const Text('Hủy'),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                TextButton(
                  child: const Text('Lưu'),
                  onPressed: () {
                    final currentPass = _currentPasswordController.text;
                    final newPass = _newPasswordController.text;
                    final confirmPass = _confirmPasswordController.text;

                    if (currentPass.isEmpty ||
                        newPass.isEmpty ||
                        confirmPass.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Vui lòng nhập đầy đủ thông tin'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }
                    if (newPass.length < 6) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Mật khẩu mới phải có ít nhất 6 ký tự'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }
                    if (newPass != confirmPass) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Mật khẩu mới không khớp'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }
                    if (newPass == currentPass) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Mật khẩu mới phải khác mật khẩu hiện tại',
                          ),
                          backgroundColor: Colors.orange,
                        ),
                      );
                      return;
                    }

                    // TODO: Gọi API/Firebase Auth để đổi mật khẩu
                    print('Gọi API đổi mật khẩu...');
                    print('MK hiện tại: $currentPass');
                    print('MK mới: $newPass');

                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Yêu cầu đổi mật khẩu đã được gửi (chức năng cần hoàn thiện)',
                        ),
                        backgroundColor: Colors.blue,
                      ),
                    );
                  },
                ),
              ],
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15.0),
              ),
            );
          },
        );
      },
    );
  }

  // Hàm _buildEditableField giữ nguyên
  Widget _buildEditableField({
    required String label,
    required String value,
    required VoidCallback onEditPressed,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
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
                    border: Border.all(color: Colors.grey[350]!),
                  ),
                  child: Text(
                    value.isNotEmpty ? value : 'Chưa cập nhật',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: Icon(Icons.edit_outlined, color: Colors.teal[700]),
                onPressed: onEditPressed,
                tooltip: 'Chỉnh sửa $label',
                splashRadius: 20,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Hàm _buildReadOnlyField giữ nguyên
  Widget _buildReadOnlyField({required String label, required String value}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 14)),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 15),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey[350]!),
            ),
            child: Text(
              value.isNotEmpty ? value : 'N/A',
              style: const TextStyle(fontSize: 16, color: Colors.black54),
            ),
          ),
        ],
      ),
    );
  }

  // Hàm xử lý khi nhấn nút Lưu thay đổi
  Future<void> _saveProfileChanges() async {
    // <<< SỬA: Kiểm tra widget.docId trước khi lưu >>>
    if (widget.docId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lỗi: Không xác định được người dùng để cập nhật.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    // Kiểm tra xem có dữ liệu gốc không
    if (_originalUserData == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lỗi: Không có dữ liệu gốc để so sánh thay đổi.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Kiểm tra xem có thay đổi nào không
    bool hasChanges =
        _hoTen != _originalUserData!.fullName ||
        _ngaySinh != _originalUserData!.birthdayFormatted ||
        _gioiTinh != (_originalUserData!.gender ?? '') ||
        _email != _originalUserData!.email;

    if (!hasChanges) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không có thay đổi nào để lưu.'),
          backgroundColor: Colors.grey,
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    Timestamp? birthdayTimestamp = _parseDate(_ngaySinh);
    if (birthdayTimestamp == null &&
        _ngaySinh.isNotEmpty &&
        _ngaySinh != 'Chưa cập nhật' &&
        _ngaySinh != 'Ngày không hợp lệ') {
      if (mounted)
        setState(() {
          _isSaving = false;
        });
      return;
    }

    Map<String, dynamic> updatedData = {
      'full_name': _hoTen,
      'email': _email, // Cẩn thận nếu email dùng để đăng nhập
      'gender': _gioiTinh,
      'birthday': birthdayTimestamp,
      // Không cập nhật user_id, authUid, role từ màn hình này
    };

    // <<< SỬA: Gọi service updateUser với Document ID từ widget >>>
    bool success = await _userService.updateUser(widget.docId, updatedData);

    if (mounted) {
      setState(() {
        _isSaving = false;
      });
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã lưu thay đổi thành công'),
            backgroundColor: Colors.green,
          ),
        );
        // <<< SỬA: Trả về true để báo cho SettingsScreen biết cần load lại >>>
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lưu thay đổi thất bại. Vui lòng thử lại.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Hàm helper _parseDate giữ nguyên
  Timestamp? _parseDate(String dateString) {
    if (dateString.isEmpty ||
        dateString == 'Chưa cập nhật' ||
        dateString == 'Ngày không hợp lệ') {
      return null;
    }
    try {
      final format = DateFormat('dd/MM/yyyy');
      DateTime dateTime = format.parseStrict(dateString);
      return Timestamp.fromDate(dateTime);
    } catch (e) {
      print("Error parsing date string '$dateString': $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Định dạng ngày sinh không hợp lệ (cần dd/MM/yyyy): $dateString',
            ),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Chỉnh sửa Hồ sơ',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.teal, Colors.tealAccent[700]!],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 2.0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.teal[50]!, Colors.purple[50]!],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child:
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                // <<< SỬA: Kiểm tra _originalUserData >>>
                : _originalUserData == null
                ? const Center(
                  child: Text('Không thể tải dữ liệu để chỉnh sửa.'),
                )
                : GestureDetector(
                  onTap: () => FocusScope.of(context).unfocus(),
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 15.0,
                      vertical: 20.0,
                    ),
                    children: [
                      // Avatar giữ nguyên
                      Center(
                        child: Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            CircleAvatar(
                              radius: 55,
                              backgroundColor: Colors.white,
                              child: CircleAvatar(
                                radius: 50,
                                backgroundImage: const NetworkImage(
                                  'https://via.placeholder.com/150',
                                ),
                                onBackgroundImageError: (_, __) {},
                                child: const Icon(
                                  Icons.person,
                                  size: 60,
                                  color: Colors.grey,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 30),

                      // Form thông tin trong Card
                      Card(
                        elevation: 3.0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15.0),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildEditableField(
                                label: 'Họ và tên',
                                value: _hoTen,
                                onEditPressed:
                                    () => _showEditDialog('Họ và tên', _hoTen, (
                                      newValue,
                                    ) {
                                      if (mounted)
                                        setState(() => _hoTen = newValue);
                                    }),
                              ),
                              // <<< SỬA: Hiển thị user_id ('VNU1', 'VNU2') >>>
                              _buildReadOnlyField(
                                label: 'Mã người dùng',
                                value: _maNhanVienDisplay,
                              ),
                              _buildEditableField(
                                label: 'Ngày sinh (dd/MM/yyyy)',
                                value: _ngaySinh,
                                onEditPressed:
                                    () => _showEditDialog(
                                      'Ngày sinh',
                                      _ngaySinh,
                                      (newValue) {
                                        if (mounted)
                                          setState(() => _ngaySinh = newValue);
                                      },
                                      keyboardType: TextInputType.datetime,
                                    ),
                              ),
                              _buildEditableField(
                                label: 'Giới tính',
                                value: _gioiTinh,
                                onEditPressed:
                                    () => _showEditDialog(
                                      'Giới tính',
                                      _gioiTinh,
                                      (newValue) {
                                        if (mounted)
                                          setState(() => _gioiTinh = newValue);
                                      },
                                    ),
                              ),
                              _buildEditableField(
                                label: 'Email',
                                value: _email,
                                onEditPressed:
                                    () => _showEditDialog(
                                      'Email',
                                      _email,
                                      (newValue) {
                                        if (mounted)
                                          setState(() => _email = newValue);
                                      },
                                      keyboardType: TextInputType.emailAddress,
                                    ),
                              ),
                              const Divider(height: 30, thickness: 0.5),
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(
                                  Icons.lock_outline,
                                  color: Colors.grey[700],
                                ),
                                title: const Text('Thay đổi mật khẩu'),
                                trailing: const Icon(
                                  Icons.arrow_forward_ios,
                                  size: 16,
                                ),
                                onTap: _showChangePasswordDialog,
                                dense: true,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Nút Lưu thay đổi
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20.0,
                          vertical: 30.0,
                        ),
                        child: ElevatedButton.icon(
                          icon:
                              _isSaving
                                  ? Container()
                                  : const Icon(Icons.save_alt_outlined),
                          label:
                              _isSaving
                                  ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 3,
                                      color: Colors.white,
                                    ),
                                  )
                                  : const Text('Lưu các thay đổi'),
                          onPressed: _isSaving ? null : _saveProfileChanges,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.teal,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            textStyle: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            elevation: 3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
      ),
    );
  }
}
