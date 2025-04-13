import 'package:flutter/material.dart';
// 1. Import màn hình chi tiết dự án
// Chuyển 'app' thành tên package của bạn nếu cần
import 'package:app/screens/project_detail_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart'; // <<< Thêm import này
import 'package:app/screens/chatbot_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0; // Index của tab Home là 0

  void _onItemTapped(int index) {
    if (_selectedIndex == index)
      return; // Không làm gì nếu nhấn lại tab hiện tại

    setState(() {
      _selectedIndex = index; // Cập nhật index để icon sáng đúng
    });

    // Điều hướng
    switch (index) {
      case 0: // Home (đang ở đây)
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const FriendsListScreen()),
        );
        break;
      case 2: // Camera
        Navigator.pushReplacement(
          // Dùng pushReplacement để thay thế màn hình hiện tại
          context,
          MaterialPageRoute(builder: (context) => const CameraScreen()),
        );
        break;
      case 3: // Chat Bot
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const ChatbotScreen(),
          ), // Điều hướng đến ChatbotScreen
        );
        break;
      case 4: // Settings
        print('Navigate to Settings Screen');
        // Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true, // Gradient phủ dưới AppBar
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white70),
          onPressed: () {
            print('Menu button pressed');
            // TODO: Mở Drawer nếu có
          },
        ),
        title: const Text(
          'Thành tích',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.tealAccent[100] ?? Colors.greenAccent,
              Colors.blue[300] ?? Colors.blue,
              Colors.purple[200] ?? Colors.purpleAccent,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: kToolbarHeight + 10),
                const CircleAvatar(
                  radius: 55,
                  backgroundColor: Colors.white54,
                  // Đảm bảo file ảnh này tồn tại trong thư mục assets
                  // và đã được khai báo trong pubspec.yaml
                  backgroundImage: AssetImage('assets/placeholder_avatar.jpg'),
                ),
                const SizedBox(height: 30),
                _buildProjectCard(
                  iconData: Icons.assignment,
                  title: 'Dự án A',
                  statusIcon: Icons.check_circle,
                  statusIconColor: Colors.green,
                  context: context,
                ),
                const SizedBox(height: 15),
                _buildProjectCard(
                  iconData: Icons.calendar_today,
                  title: 'Dự án B',
                  statusIcon: Icons.sync,
                  statusIconColor: Colors.orangeAccent,
                  context: context,
                ),
                // TODO: Nếu danh sách dự án dài, sử dụng ListView.builder
              ],
            ),
          ),
        ),
      ),
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
            // <<< THAY ĐỔI ICON >>>
            icon: Icon(Icons.smart_toy_outlined), // Icon chatbot chưa chọn
            activeIcon: Icon(Icons.smart_toy), // Icon chatbot đã chọn
            label: 'Chatbot', // Đổi label nếu muốn
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
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        backgroundColor: Colors.white,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
      ),
    );
  }

  // Hàm tạo thẻ hiển thị thông tin dự án
  Widget _buildProjectCard({
    required IconData iconData,
    required String title,
    required IconData statusIcon,
    required Color statusIconColor,
    required BuildContext context,
  }) {
    return InkWell(
      onTap: () {
        // Điều hướng đến màn hình chi tiết dự án
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProjectDetailScreen(projectTitle: title),
          ),
        );
        print('Navigating to details for: $title');
      },
      borderRadius: BorderRadius.circular(25),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(25),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.deepPurple[400],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(iconData, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 10),
            Icon(statusIcon, color: statusIconColor, size: 28),
            const SizedBox(width: 8),
            InkWell(
              onTap: () {
                print('Options for $title pressed');
                // Ví dụ: Hiển thị menu chỉnh sửa, xóa,...
              },
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.all(4.0),
                child: Icon(Icons.more_vert, color: Colors.grey, size: 24),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
