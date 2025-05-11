// filepath: d:\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\screens\chatbot_screen.dart
import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel

class ChatbotScreen extends StatefulWidget {
  // <<< THÊM: Nhận currentUser (có thể null nếu không bắt buộc) >>>
  final UserModel? currentUser;

  const ChatbotScreen({Key? key, this.currentUser}) : super(key: key);

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, String>> _messages = [];
  final int _selectedIndex = 3;

  @override
  void initState() {
    super.initState();
    // In ra để kiểm tra currentUser có được truyền vào không
    print(
      'ChatbotScreen initState: currentUser is ${widget.currentUser?.fullName}',
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'sender': 'user', 'text': text});
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          // <<< THÊM: Kiểm tra mounted trước khi setState trong Future >>>
          setState(() {
            _messages.add({
              'sender': 'bot',
              'text': 'Bot đang trả lời: "$text"',
            });
          });
        }
      });
    });
    _messageController.clear();
    // TODO: Tích hợp logic gọi API chatbot thực tế ở đây
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index || widget.currentUser == null) {
      // Không điều hướng nếu nhấn tab hiện tại hoặc currentUser là null
      if (widget.currentUser == null) {
        print(
          "Lỗi: currentUser là null, không thể điều hướng từ ChatbotScreen.",
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Lỗi thông tin người dùng, không thể chuyển màn hình.',
            ),
          ),
        );
      }
      return;
    }

    // <<< SỬA: Truyền widget.currentUser! (đã kiểm tra null) >>>
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) =>
                    FriendsListScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 2: // Camera
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => CameraScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 3: // Chat Bot (đang ở đây)
        break;
      case 4: // Settings
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => SettingsScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chatbot AI'),
        backgroundColor: Colors.deepPurpleAccent,
        automaticallyImplyLeading: false, // Ẩn nút back mặc định
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(10.0),
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[_messages.length - 1 - index];
                final isUserMessage = message['sender'] == 'user';
                return Align(
                  alignment:
                      isUserMessage
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 5.0),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14.0,
                      vertical: 10.0,
                    ),
                    decoration: BoxDecoration(
                      color:
                          isUserMessage ? Colors.blue[300] : Colors.grey[300],
                      borderRadius: BorderRadius.circular(15.0),
                    ),
                    child: Text(
                      message['text']!,
                      style: TextStyle(
                        color: isUserMessage ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 5.0),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  offset: const Offset(0, -1),
                  blurRadius: 3.0,
                  color: Colors.black.withOpacity(0.1),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 10.0),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                  color: Colors.deepPurpleAccent,
                ),
              ],
            ),
          ),
        ],
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
        onTap: _onItemTapped, // <<< SỬA: Gọi hàm đã cập nhật >>>
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blueAccent[700], // Giữ màu của FriendsList
        unselectedItemColor: Colors.grey[600],
        backgroundColor: Colors.white,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
      ),
    );
  }
}
