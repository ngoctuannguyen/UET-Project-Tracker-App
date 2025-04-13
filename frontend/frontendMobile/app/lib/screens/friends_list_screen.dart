import 'package:flutter/material.dart';
// Import màn hình Chat (sẽ tạo ở bước 2)
import 'package:app/screens/chat_screen.dart'; // <<< THAY 'app' bằng tên package của bạn
// Import các màn hình khác nếu cần điều hướng từ đây (ví dụ: HomeScreen)
import 'package:app/screens/home_screen.dart'; // <<< THAY 'app' bằng tên package của bạn
import 'package:app/screens/chatbot_screen.dart';

// Dữ liệu giả lập cho danh sách bạn bè
const List<Map<String, String>> friendsData = [
  {
    'name': 'Jhon Abraham',
    'avatarUrl':
        'assets/placeholder_avatar.jpg', // Sử dụng cùng avatar cho tiện
    'status': 'Active now',
  },
  {
    'name': 'Nazrul Islam',
    'avatarUrl':
        'assets/placeholder_avatar_2.png', // Cần thêm ảnh này vào assets
    'status': 'Offline',
  },
  {
    'name': 'Another Friend',
    'avatarUrl':
        'assets/placeholder_avatar_3.png', // Cần thêm ảnh này vào assets
    'status': 'Active 5m ago',
  },
];

class FriendsListScreen extends StatefulWidget {
  const FriendsListScreen({Key? key}) : super(key: key);

  @override
  State<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends State<FriendsListScreen> {
  // Giữ index của tab hiện tại (Nhóm là index 1)
  int _selectedIndex = 1;

  void _onItemTapped(int index) {
    if (index == _selectedIndex)
      return; // Không làm gì nếu nhấn lại tab hiện tại

    setState(() {
      _selectedIndex = index;
    });

    // Điều hướng dựa trên index được nhấn
    switch (index) {
      case 0: // Home
        // Thay thế màn hình hiện tại bằng HomeScreen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
        break;
      case 1: // Nhóm (đang ở đây rồi)
        break;
      case 2: // Camera
        // TODO: Điều hướng đến màn hình Camera/Report
        print('Navigate to Camera/Report Screen');
        // Ví dụ: Navigator.push(context, MaterialPageRoute(builder: (context) => ReportScreen()));
        break;
      case 3: // Chat (Tab Bot?) - Có thể là màn hình Chat tổng hợp khác?
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const ChatbotScreen(),
          ), // Điều hướng đến ChatbotScreen
        );
        break;
      case 4: // Cài đặt
        // TODO: Điều hướng đến màn hình Settings
        print('Navigate to Settings Screen');
        // Ví dụ: Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhóm'), // Hoặc 'Bạn bè'
        centerTitle: true,
        // Có thể thêm các actions khác nếu cần
      ),
      body: ListView.builder(
        itemCount: friendsData.length,
        itemBuilder: (context, index) {
          final friend = friendsData[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundImage: AssetImage(friend['avatarUrl']!),
              // Thêm chấm trạng thái online/offline nếu muốn
              // child: Stack(
              //   children: [
              //      if (friend['status'] == 'Active now')
              //       Positioned( bottom: 0, right: 0, child: Container(...)) // Chấm xanh
              //   ]
              // ),
            ),
            title: Text(friend['name']!),
            subtitle: Text(friend['status']!),
            onTap: () {
              // Điều hướng đến màn hình Chat chi tiết khi nhấn vào bạn bè
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder:
                      (context) => ChatScreen(
                        friendName: friend['name']!,
                        friendAvatarUrl: friend['avatarUrl']!,
                        friendStatus: friend['status']!,
                      ),
                ),
              );
            },
          );
        },
      ),
      // BottomNavigationBar giữ nguyên cấu trúc, nhưng onTap dùng hàm của màn hình này
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
        currentIndex: _selectedIndex, // Index là 1 cho tab Nhóm
        onTap: _onItemTapped, // Sử dụng hàm điều hướng của màn hình này
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
