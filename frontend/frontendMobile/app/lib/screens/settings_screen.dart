import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/edit_profile_screen.dart';
import 'package:app/screens/login_screen.dart';
import 'package:app/services/user_service.dart';
import 'package:app/models/user_model.dart';

class SettingsScreen extends StatefulWidget {
  // <<< SỬA: Nhận UserModel >>>
  final UserModel currentUser;

  const SettingsScreen({Key? key, required this.currentUser}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final int _selectedIndex = 4;
  final UserService _userService = UserService();
  // <<< SỬA: Dùng state để lưu user, khởi tạo từ widget >>>
  late UserModel _currentUserData;
  bool _isLoading = false; // Chỉ loading khi refresh

  @override
  void initState() {
    super.initState();
    // <<< SỬA: Khởi tạo state từ dữ liệu được truyền vào >>>
    _currentUserData = widget.currentUser;
    print(
      'SettingsScreen initState: currentUser is ${_currentUserData.fullName}, docId: ${_currentUserData.docId}',
    );
  }

  // <<< SỬA: Hàm load lại dữ liệu (dùng cho RefreshIndicator) >>>
  Future<void> _loadUserData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });

    // <<< SỬA: Load lại bằng Document ID để đảm bảo lấy đúng user >>>
    UserModel? refreshedUser = await _userService.getUserByDocId(
      _currentUserData.docId,
    );

    if (mounted) {
      setState(() {
        if (refreshedUser != null) {
          _currentUserData = refreshedUser; // Cập nhật state nếu thành công
          print(
            'SettingsScreen refreshed: currentUser is ${_currentUserData.fullName}',
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Không thể làm mới thông tin người dùng.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        _isLoading = false;
      });
    }
  }

  // Hàm điều hướng BottomNavigationBar
  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    // <<< SỬA: Truyền _currentUserData khi điều hướng >>>
    switch (index) {
      case 0:
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder:
                (_, __, ___) => HomeScreen(currentUser: _currentUserData),
            transitionsBuilder:
                (_, a, __, c) => FadeTransition(opacity: a, child: c),
            settings: const RouteSettings(name: '/home'), // Thêm tên route
          ),
        );
        break;
      case 1:
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            // <<< SỬA: Truyền _currentUserData >>>
            pageBuilder:
                (_, __, ___) =>
                    FriendsListScreen(currentUser: _currentUserData),
            transitionsBuilder:
                (_, a, __, c) => FadeTransition(opacity: a, child: c),
            settings: const RouteSettings(name: '/friends'), // Thêm tên route
          ),
        );
        break;
      case 2:
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            // <<< SỬA: Truyền _currentUserData >>>
            pageBuilder:
                (_, __, ___) => CameraScreen(currentUser: _currentUserData),
            transitionsBuilder:
                (_, a, __, c) => FadeTransition(opacity: a, child: c),
            settings: const RouteSettings(name: '/camera'), // Thêm tên route
          ),
        );
        break;
      case 3:
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            // <<< SỬA: Truyền _currentUserData >>>
            pageBuilder:
                (_, __, ___) => ChatbotScreen(currentUser: _currentUserData),
            transitionsBuilder:
                (_, a, __, c) => FadeTransition(opacity: a, child: c),
            settings: const RouteSettings(name: '/chatbot'), // Thêm tên route
          ),
        );
        break;
      case 4: // Đang ở Settings
        break;
    }
  }

  // Hàm xử lý đăng xuất (Giữ nguyên logic điều hướng, thêm TODO xóa token)
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
              onPressed: () async {
                // Thêm async nếu cần await xóa token
                Navigator.of(context).pop(); // Đóng dialog trước
                // TODO: Xóa token đã lưu (nếu có)
                // Ví dụ: await storage.delete(key: 'idToken');
                // await storage.delete(key: 'refreshToken');
                // await storage.delete(key: 'uid');

                // Đảm bảo context vẫn còn hợp lệ trước khi điều hướng
                if (mounted) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const LoginScreen(),
                      settings: const RouteSettings(
                        name: '/login',
                      ), // Tên route
                    ),
                    (Route<dynamic> route) => false,
                  );
                  print('Đã đăng xuất và quay về Login Screen!');
                }
              },
            ),
          ],
        );
      },
    );
  }

  // Hàm build một trường thông tin chỉ đọc (Giữ nguyên)
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700], fontSize: 15)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : 'Chưa cập nhật',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              textAlign: TextAlign.right,
              softWrap: true,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // <<< SỬA: Lấy dữ liệu từ state _currentUserData >>>
    final String displayName = _currentUserData.fullName;
    final String displayUserId = _currentUserData.userId; // 'VNU1', 'VNU2'
    final String displayBirthday = _currentUserData.birthdayFormatted;
    final String displayGender = _currentUserData.gender ?? '';
    final String displayEmail = _currentUserData.email;
    final String avatarUrl = 'https://via.placeholder.com/150'; // Tạm thời

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông tin cá nhân'),
        backgroundColor: Colors.teal,
        automaticallyImplyLeading: false,
        elevation: 1.0,
        actions: [
          // Nút chỉnh sửa
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Chỉnh sửa thông tin',
            onPressed: () {
              // <<< SỬA: Đảm bảo _currentUserData.docId không rỗng trước khi điều hướng >>>
              if (_currentUserData.docId.isNotEmpty) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    // <<< SỬA: Truyền docId ('user1', 'user2') sang EditProfileScreen >>>
                    builder:
                        (context) =>
                            EditProfileScreen(docId: _currentUserData.docId),
                    settings: const RouteSettings(
                      name: '/editProfile',
                    ), // Tên route
                  ),
                ).then((result) {
                  // Kiểm tra mounted trước khi gọi _loadUserData
                  if (mounted && result == true) {
                    // Nếu EditProfileScreen trả về true
                    print("Reloading user data after edit...");
                    _loadUserData(); // Load lại dữ liệu
                  }
                });
              } else {
                print("Lỗi: Không có docId để chỉnh sửa hồ sơ.");
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Lỗi: Không thể xác định người dùng.'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.teal[50]!, Colors.purple[50]!],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        // <<< SỬA: Dùng RefreshIndicator và không cần check _isLoading ban đầu >>>
        child: RefreshIndicator(
          onRefresh: _loadUserData,
          child: ListView(
            padding: const EdgeInsets.all(20.0),
            children: [
              // Avatar
              Center(
                child: CircleAvatar(
                  radius: 55,
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundImage: NetworkImage(avatarUrl),
                    onBackgroundImageError: (_, __) {
                      print("Error loading avatar image.");
                    },
                    child:
                        avatarUrl.isEmpty || avatarUrl.contains('placeholder')
                            ? const Icon(
                              Icons.person,
                              size: 60,
                              color: Colors.grey,
                            )
                            : null,
                  ),
                ),
              ),
              const SizedBox(height: 30),
              // Thông tin chi tiết trong Card
              Card(
                elevation: 4.0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15.0),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 25.0,
                  ),
                  child: Column(
                    children: [
                      _buildInfoRow('Họ và tên', displayName),
                      const Divider(height: 20),
                      _buildInfoRow(
                        'Mã người dùng',
                        displayUserId,
                      ), // Hiển thị 'VNU1', 'VNU2'
                      const Divider(height: 20),
                      _buildInfoRow('Ngày sinh', displayBirthday),
                      const Divider(height: 20),
                      _buildInfoRow('Giới tính', displayGender),
                      const Divider(height: 20),
                      _buildInfoRow('Email', displayEmail),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // Nút đăng xuất
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.logout, color: Colors.white),
                  label: const Text('Đăng xuất'),
                  onPressed: _logout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
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
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      // BottomNavigationBar
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
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey[600],
        backgroundColor: Colors.white,
        elevation: 8.0,
        // <<< THÊM: Hiển thị label để dễ debug >>>
        showSelectedLabels: true,
        showUnselectedLabels: true,
      ),
    );
  }
}
