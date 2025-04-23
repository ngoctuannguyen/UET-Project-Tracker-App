import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chat_screen.dart'; // Import màn hình chat

// Định nghĩa một class để chứa thông tin nhóm chat
class GroupChatInfo {
  final String id;
  final String name;
  final List<String> members;
  final String lastMessage;
  final String time;
  final IconData icon; // Icon đại diện cho nhóm

  GroupChatInfo({
    required this.id,
    required this.name,
    required this.members,
    this.lastMessage = "",
    this.time = "",
    this.icon = Icons.group_work, // Icon mặc định
  });
}

class FriendsListScreen extends StatefulWidget {
  const FriendsListScreen({Key? key}) : super(key: key);

  @override
  State<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends State<FriendsListScreen> {
  int _selectedIndex = 1; // Index của tab Nhóm là 1

  // <<< THAY ĐỔI DỮ LIỆU: Danh sách các nhóm chat >>>
  final List<GroupChatInfo> groupChats = [
    GroupChatInfo(
      id: 'du_an_a',
      name: 'Dự án A',
      members: ['Alice', 'Bob', 'Charlie', 'Bạn'], // Danh sách thành viên mẫu
      lastMessage: 'Họp vào lúc 3h chiều nay nhé!',
      time: '10:30 AM',
      icon: Icons.assignment, // Icon cho dự án A
    ),
    GroupChatInfo(
      id: 'du_an_b',
      name: 'Dự án B',
      members: ['David', 'Eve', 'Bạn'], // Danh sách thành viên mẫu
      lastMessage: 'File thiết kế đã được cập nhật.',
      time: '09:15 AM',
      icon: Icons.design_services, // Icon cho dự án B
    ),
    // Thêm các nhóm khác nếu cần
  ];

  // Hàm điều hướng cho BottomNavigationBar
  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
        break;
      case 1: // Nhóm (đang ở đây)
        break;
      case 2: // Camera
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const CameraScreen()),
        );
        break;
      case 3: // Chat Bot
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const ChatbotScreen()),
        );
        break;
      case 4: // Settings
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const SettingsScreen()),
        );
        break;
    }
  }

  // <<< THÊM HÀM: Hiển thị dialog danh sách thành viên >>>
  Future<void> _showGroupMembers(
    BuildContext context,
    GroupChatInfo group,
  ) async {
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Thành viên nhóm "${group.name}"'),
          content: SizedBox(
            // Giới hạn chiều cao của danh sách
            width: double.maxFinite,
            height: 300, // Điều chỉnh chiều cao nếu cần
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: group.members.length,
              itemBuilder: (BuildContext context, int index) {
                return ListTile(
                  leading: const Icon(Icons.person),
                  title: Text(group.members[index]),
                );
              },
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Đóng'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách nhóm dự án'),
        backgroundColor: Colors.blueAccent,
        automaticallyImplyLeading: false, // Ẩn nút back nếu không cần
      ),
      // <<< THAY ĐỔI BODY: Hiển thị danh sách nhóm >>>
      body: ListView.separated(
        itemCount: groupChats.length,
        separatorBuilder:
            (context, index) =>
                const Divider(height: 0), // Đường kẻ giữa các item
        itemBuilder: (context, index) {
          final group = groupChats[index];
          return ListTile(
            leading: CircleAvatar(
              // Avatar cho nhóm
              child: Icon(group.icon),
              backgroundColor: Colors.grey[300],
            ),
            title: Text(
              group.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              group.lastMessage,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Row(
              // Sử dụng Row để chứa thời gian và nút xem thành viên
              mainAxisSize: MainAxisSize.min, // Giới hạn kích thước của Row
              children: [
                Text(
                  group.time,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(width: 8), // Khoảng cách nhỏ
                IconButton(
                  // Nút xem thành viên
                  icon: const Icon(Icons.group_outlined),
                  tooltip: 'Xem thành viên',
                  onPressed: () {
                    _showGroupMembers(
                      context,
                      group,
                    ); // Gọi hàm hiển thị dialog
                  },
                  constraints:
                      const BoxConstraints(), // Bỏ padding mặc định của IconButton
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            onTap: () {
              // Điều hướng đến màn hình chat của nhóm
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder:
                      (context) => ChatScreen(
                        // Truyền ID hoặc tên nhóm để ChatScreen biết đang chat với nhóm nào
                        // Bạn cần cập nhật ChatScreen để nhận và xử lý tham số này
                        chatTargetId: group.id,
                        chatTargetName: group.name,
                        isGroupChat:
                            true, // Thêm cờ để phân biệt nhóm và cá nhân
                      ),
                ),
              );
              print('Vào chat nhóm: ${group.name}');
            },
          );
        },
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
          ), // Icon Nhóm
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
