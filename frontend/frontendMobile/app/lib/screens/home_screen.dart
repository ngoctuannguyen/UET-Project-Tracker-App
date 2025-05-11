import 'package:flutter/material.dart';
import 'package:app/screens/project_detail_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel

class HomeScreen extends StatefulWidget {
  // <<< SỬA: Nhận UserModel >>>
  final UserModel currentUser;

  const HomeScreen({Key? key, required this.currentUser}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    print(
      'HomeScreen initState: currentUser is ${widget.currentUser.fullName}, docId: ${widget.currentUser.docId}',
    );
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    // Điều hướng bằng pushReplacement để thay thế màn hình hiện tại
    switch (index) {
      case 0: // Home (đang ở đây)
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => FriendsListScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/friends'),
          ),
        );
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

  @override
  Widget build(BuildContext context) {
    print('HomeScreen build với user: ${widget.currentUser.fullName}');
    String userDisplayName =
        widget.currentUser.fullName.isNotEmpty
            ? widget.currentUser.fullName.split(' ').last
            : 'User';
    String userInitial =
        userDisplayName.isNotEmpty ? userDisplayName[0].toUpperCase() : '?';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white70),
          onPressed: () {
            print('Menu button pressed');
            // TODO: Implement drawer
          },
        ),
        title: const Text(
          'Trang chủ',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 10.0),
            child: GestureDetector(
              onTap: () => _onItemTapped(4),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.white54,
                child: Text(userInitial),
              ),
            ),
          ),
        ],
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
                CircleAvatar(
                  radius: 55,
                  backgroundColor: Colors.white54,
                  child: Text(
                    userInitial,
                    style: TextStyle(
                      fontSize: 40,
                      color: Colors.deepPurple[400],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  widget.currentUser.fullName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  widget.currentUser.email,
                  style: const TextStyle(fontSize: 14, color: Colors.white70),
                ),
                const SizedBox(height: 30),
                // TODO: Thay thế bằng danh sách dự án thực tế từ API/DB
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
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        backgroundColor: Colors.white,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        elevation: 8.0,
      ),
    );
  }

  Widget _buildProjectCard({
    required IconData iconData,
    required String title,
    required IconData statusIcon,
    required Color statusIconColor,
    required BuildContext context,
  }) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            // <<< SỬA: Đảm bảo truyền currentUser vào ProjectDetailScreen >>>
            builder:
                (context) => ProjectDetailScreen(
                  projectTitle: title,
                  currentUser: widget.currentUser, // Truyền currentUser
                ),
            settings: RouteSettings(name: '/projectDetail/$title'),
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
                // TODO: Implement options menu
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
