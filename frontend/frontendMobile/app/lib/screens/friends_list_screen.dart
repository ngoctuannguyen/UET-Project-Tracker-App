import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chat_screen.dart';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel

// Lớp tạm thời cho thông tin nhóm chat
class GroupChatInfo {
  final String id;
  final String name;
  final List<String> members; // Tạm thời giữ kiểu String
  final String lastMessage;
  final String time;
  final IconData icon;

  GroupChatInfo({
    required this.id,
    required this.name,
    required this.members,
    this.lastMessage = "",
    this.time = "",
    this.icon = Icons.group_work,
  });
}

class FriendsListScreen extends StatefulWidget {
  // <<< THÊM: Nhận currentUser (bắt buộc vì cần cho ChatScreen) >>>
  final UserModel currentUser;

  const FriendsListScreen({Key? key, required this.currentUser})
    : super(key: key);

  @override
  State<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends State<FriendsListScreen> {
  int _selectedIndex = 1;

  // TODO: Thay thế list cứng này bằng việc gọi API/Firestore
  final List<GroupChatInfo> groupChats = [
    GroupChatInfo(
      id: 'du_an_a', // ID group thực tế
      name: 'Dự án A',
      members: ['Alice', 'Bob', 'Charlie', 'Bạn'],
      lastMessage: 'Họp vào lúc 3h chiều nay nhé!',
      time: '10:30 AM',
      icon: Icons.assignment,
    ),
    GroupChatInfo(
      id: 'du_an_b', // ID group thực tế
      name: 'Dự án B',
      members: ['David', 'Eve', 'Bạn'],
      lastMessage: 'File thiết kế đã được cập nhật.',
      time: '09:15 AM',
      icon: Icons.design_services,
    ),
  ];

  @override
  void initState() {
    super.initState();
    print(
      'FriendsListScreen initState: currentUser is ${widget.currentUser.fullName}',
    );
    // TODO: Gọi API/Firestore để load danh sách nhóm thực tế
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    // Điều hướng bằng pushReplacement
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/home'),
          ),
        );
        break;
      case 1: // Nhóm (đang ở đây)
        break;
      case 2: // Camera
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CameraScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/camera'),
          ),
        );
        break;
      case 3: // Chat Bot
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => ChatbotScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/chatbot'),
          ),
        );
        break;
      case 4: // Settings
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => SettingsScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/settings'),
          ),
        );
        break;
    }
  }

  // Hàm hiển thị dialog thành viên (tạm thời dùng list cứng)
  Future<void> _showGroupMembers(
    BuildContext context,
    GroupChatInfo group,
  ) async {
    // TODO: Lấy danh sách thành viên thực tế từ API/Firestore dựa trên group.id
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Thành viên nhóm "${group.name}"'),
          content: SizedBox(
            width: double.maxFinite,
            height: MediaQuery.of(context).size.height * 0.4,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: group.members.length,
              itemBuilder: (BuildContext context, int index) {
                return ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: Text(group.members[index]),
                );
              },
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Đóng'),
              onPressed: () => Navigator.of(context).pop(),
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
        automaticallyImplyLeading: false,
      ),
      body: ListView.separated(
        itemCount: groupChats.length,
        separatorBuilder: (context, index) => const Divider(height: 0),
        itemBuilder: (context, index) {
          final group = groupChats[index];
          return ListTile(
            leading: CircleAvatar(
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
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  group.time,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.info_outline),
                  tooltip: 'Xem thành viên',
                  onPressed: () => _showGroupMembers(context, group),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
            onTap: () {
              // <<< SỬA: Truyền widget.currentUser vào ChatScreen >>>
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder:
                      (context) => ChatScreen(
                        chatTargetId: group.id,
                        chatTargetName: group.name,
                        currentUser: widget.currentUser, // Truyền currentUser
                      ),
                  settings: RouteSettings(name: '/chat/${group.id}'),
                ),
              );
              print('Vào chat nhóm: ${group.name}');
            },
          );
        },
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
        showSelectedLabels: true,
        showUnselectedLabels: true,
        elevation: 8.0,
      ),
    );
  }
}
