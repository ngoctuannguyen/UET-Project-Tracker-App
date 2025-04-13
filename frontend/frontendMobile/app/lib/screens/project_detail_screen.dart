import 'package:flutter/material.dart';
import 'package:app/screens/friends_list_screen.dart';
// import 'package:app/screens/report_screen.dart';
// import 'package:app/screens/general_chat_screen.dart';
// import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chatbot_screen.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectTitle; // Nhận tiêu đề dự án từ HomeScreen

  const ProjectDetailScreen({Key? key, required this.projectTitle})
    : super(key: key);

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  int _selectedIndex = 0; // Index của tab hiện tại

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
        print('Navigate to Camera/Report Screen');
        // Navigator.push(context, MaterialPageRoute(builder: (context) => ReportScreen()));
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
      extendBodyBehindAppBar: true, // Cho gradient phủ dưới AppBar
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black54, size: 30),
          onPressed: () {
            // Quay lại màn hình trước đó (HomeScreen)
            Navigator.pop(context);
          },
        ),
        title: Text(
          // Có thể dùng widget.projectTitle thay thế
          'Thành tích',
          style: const TextStyle(
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
                  backgroundImage: AssetImage('assets/placeholder_avatar.jpg'),
                ),
                const SizedBox(height: 30),
                _buildTaskCard(
                  date: 'Ngày 19/2/2025',
                  statusIcon: Icons.check_circle,
                  statusIconColor: Colors.green,
                ),
                const SizedBox(height: 15),
                _buildTaskCard(
                  date: 'Ngày 19/2/2025',
                  subtitle: 'Còn 2h34p nữa',
                  statusIcon: Icons.sync,
                  statusIconColor: Colors.orangeAccent,
                ),
                const SizedBox(height: 15),
                _buildTaskCard(
                  date: 'Ngày 19/2/2025',
                  subtitle: 'Trễ 30p',
                  statusIcon: Icons.error_outline,
                  statusIconColor: Colors.redAccent,
                ),
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
        selectedItemColor: Colors.blueAccent[700],
        unselectedItemColor: Colors.grey[600],
        backgroundColor: Colors.white,
        type: BottomNavigationBarType.fixed,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
        onTap: _onItemTapped,
      ),
    );
  }

  // Widget helper tạo một thẻ Task
  Widget _buildTaskCard({
    required String date,
    String? subtitle,
    required IconData statusIcon,
    required Color statusIconColor,
    Widget? statusWidget,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
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
            child: const Icon(
              Icons.calendar_today_outlined,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null && subtitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),
          statusWidget ?? Icon(statusIcon, color: statusIconColor, size: 28),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              print('Options for task on $date pressed');
            },
            borderRadius: BorderRadius.circular(20),
            child: const Padding(
              padding: EdgeInsets.all(4.0),
              child: Icon(Icons.more_vert, color: Colors.grey, size: 24),
            ),
          ),
        ],
      ),
    );
  }
}
