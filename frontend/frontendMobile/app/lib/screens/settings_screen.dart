import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/edit_profile_screen.dart'; // <<< IMPORT MÀN HÌNH EDIT MỚI >>>
import 'package:app/screens/login_screen.dart'; // Import LoginScreen để đăng xuất

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final int _selectedIndex = 4; // Index của tab Settings

  // --- Dữ liệu người dùng (chỉ đọc) ---
  // TODO: Lấy dữ liệu người dùng thực tế từ API hoặc state quản lý chung
  final String _hoTen = "Nguyễn Văn A";
  final String _maNhanVien = "NV001";
  final String _ngaySinh = "01/01/1990";
  final String _gioiTinh = "Nam";
  final String _email = "a.nguyenvan@example.com";
  final String _avatarUrl =
      'https://via.placeholder.com/150'; // Ảnh placeholder

  // Hàm điều hướng BottomNavigationBar (giữ nguyên)
  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    switch (index) {
      case 0:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
        break;
      case 1:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const FriendsListScreen()),
        );
        break;
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const CameraScreen()),
        );
        break;
      case 3:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ChatbotScreen()),
        );
        break;
      case 4: // Đang ở Settings
        break;
    }
  }

  // Hàm xử lý đăng xuất (cập nhật để điều hướng về LoginScreen)
  void _logout() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Xác nhận Đăng xuất'),
          content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
          actions: <Widget>[
            TextButton(
              child: const Text('Hủy'),
              onPressed: () => Navigator.of(context).pop(),
            ),
            TextButton(
              child: const Text(
                'Đăng xuất',
                style: TextStyle(color: Colors.red),
              ),
              onPressed: () {
                Navigator.of(context).pop(); // Đóng dialog

                // TODO: Xóa token đã lưu (nếu có)
                // await storage.deleteAll();

                // Điều hướng về màn hình Login và xóa hết các màn hình cũ khỏi stack
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (Route<dynamic> route) => false, // Xóa hết route cũ
                );
                print('Đã đăng xuất và quay về Login Screen!');
              },
            ),
          ],
        );
      },
    );
  }

  // Hàm build một trường thông tin chỉ đọc
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 15)),
          Text(
            value,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông tin cá nhân'),
        backgroundColor: Colors.teal, // Màu AppBar
        automaticallyImplyLeading: false, // Không cần nút back ở đây
        actions: [
          // <<< NÚT CHỈNH SỬA THÔNG TIN >>>
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Chỉnh sửa thông tin',
            onPressed: () {
              // Điều hướng đến màn hình EditProfileScreen
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const EditProfileScreen(),
                ),
              ).then((_) {
                // TODO: Cập nhật lại thông tin trên màn hình này sau khi chỉnh sửa xong (nếu cần)
                // Ví dụ: gọi lại API lấy thông tin user hoặc cập nhật state từ kết quả trả về
                print("Quay lại từ màn hình chỉnh sửa");
                // setState(() { /* Cập nhật dữ liệu nếu cần */ });
              });
            },
          ),
        ],
      ),
      // <<< BODY HIỂN THỊ THÔNG TIN NGƯỜI DÙNG >>>
      body: Container(
        decoration: BoxDecoration(
          // Gradient nền
          gradient: LinearGradient(
            colors: [Colors.teal[50]!, Colors.purple[50]!],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: ListView(
          // Dùng ListView để nội dung dài có thể cuộn
          padding: const EdgeInsets.all(20.0),
          children: [
            // Avatar
            Center(
              child: CircleAvatar(
                radius: 55,
                backgroundColor: Colors.white,
                child: CircleAvatar(
                  radius: 50,
                  backgroundImage: NetworkImage(_avatarUrl),
                  onBackgroundImageError: (_, __) {},
                  child:
                      _avatarUrl.isEmpty
                          ? const Icon(
                            Icons.person,
                            size: 50,
                            color: Colors.grey,
                          )
                          : null,
                ),
              ),
            ),
            const SizedBox(height: 25),

            // Thông tin chi tiết
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 15.0,
                vertical: 20.0,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(15.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  _buildInfoRow('Họ và tên', _hoTen),
                  const Divider(),
                  _buildInfoRow('Mã nhân viên', _maNhanVien),
                  const Divider(),
                  _buildInfoRow('Ngày sinh', _ngaySinh),
                  const Divider(),
                  _buildInfoRow('Giới tính', _gioiTinh),
                  const Divider(),
                  _buildInfoRow('Email', _email),
                ],
              ),
            ),
            const SizedBox(height: 40), // Khoảng cách trước nút đăng xuất
            // <<< NÚT ĐĂNG XUẤT >>>
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
              ), // Thêm padding ngang
              child: ElevatedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text('Đăng xuất'),
                onPressed: _logout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent, // Màu đỏ cho nút đăng xuất
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
            const SizedBox(height: 20), // Khoảng cách dưới cùng
          ],
        ),
      ),
      // BottomNavigationBar giữ nguyên
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.group_outlined),
            activeIcon: Icon(Icons.group),
            label: 'Nhóm',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt_outlined),
            activeIcon: Icon(Icons.camera_alt),
            label: 'Camera',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.smart_toy_outlined),
            activeIcon: Icon(Icons.smart_toy),
            label: 'Chatbot',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blueAccent[700],
        unselectedItemColor: Colors.grey[600],
        backgroundColor: Colors.white,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
      ),
    );
  }
}
