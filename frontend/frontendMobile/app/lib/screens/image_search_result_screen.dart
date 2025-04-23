import 'dart:io';
import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/report_screen.dart'; // <<< THÊM IMPORT NÀY
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';

// <<< ĐỔI TÊN CLASS >>>
class ImageSearchResultScreen extends StatefulWidget {
  final String imagePath;

  const ImageSearchResultScreen({Key? key, required this.imagePath})
    : super(key: key);

  @override
  // <<< ĐỔI TÊN STATE CLASS >>>
  State<ImageSearchResultScreen> createState() =>
      _ImageSearchResultScreenState();
}

// <<< ĐỔI TÊN STATE CLASS >>>
class _ImageSearchResultScreenState extends State<ImageSearchResultScreen> {
  int _selectedIndex = 2; // Vẫn giữ index 2

  @override
  void dispose() {
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const FriendsListScreen()),
        );
        break;
      case 2: // Camera
        // Quay lại màn hình chụp ảnh
        Navigator.pushReplacement(
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
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const SettingsScreen(),
          ), // Điều hướng đến SettingsScreen
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black54, size: 30),
          onPressed: () {
            Navigator.pop(context); // Quay lại CameraScreen
          },
        ),
        title: const Text(
          'Kết quả',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                // Phần Thông tin người dùng (Giữ nguyên)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.grey[300],
                      child: const Icon(
                        Icons.person,
                        size: 35,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Container(
                        height: 50,
                        decoration: BoxDecoration(
                          color:
                              Colors.lightGreenAccent[400] ??
                              Colors.greenAccent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.black54, width: 0.5),
                        ),
                        child: const Center(
                          child: Text(
                            'Thông tin người dùng...',
                            style: TextStyle(color: Colors.black54),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 25),

                // Phần Ảnh đã chụp (Giữ nguyên)
                const Text(
                  'Ảnh đã chụp',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blueGrey, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10.0),
                    child: Image.file(
                      File(widget.imagePath),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        print("Lỗi load ảnh: $error");
                        return const Center(
                          child: Icon(
                            Icons.error_outline,
                            color: Colors.redAccent,
                            size: 50,
                          ),
                        );
                      },
                      frameBuilder: (
                        context,
                        child,
                        frame,
                        wasSynchronouslyLoaded,
                      ) {
                        if (wasSynchronouslyLoaded) return child;
                        return AnimatedOpacity(
                          child: child,
                          opacity: frame == null ? 0 : 1,
                          duration: const Duration(seconds: 1),
                          curve: Curves.easeOut,
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 25),

                // Phần Kết quả tìm kiếm (Giữ nguyên)
                const Text(
                  'Kết quả tìm kiếm',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        '(Chưa có kết quả)',
                        style: TextStyle(color: Colors.grey, fontSize: 16),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // <<< THÊM NÚT BÁO CÁO >>>
                // ...existing code...

                // <<< THAY ĐỔI NÚT BÁO CÁO >>>
                Center(
                  // Thay ElevatedButton.icon bằng ElevatedButton
                  child: ElevatedButton(
                    // Bỏ tham số 'icon'
                    // child thay thế cho 'label'
                    child: const Text(
                      'Báo cáo',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: () {
                      // Điều hướng sang màn hình ReportScreen mới và truyền imagePath
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder:
                              (context) => ReportScreen(
                                imagePath: widget.imagePath,
                              ), // Sử dụng ReportScreen mới
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      // Giữ nguyên style hoặc điều chỉnh nếu cần
                      backgroundColor: const Color.fromARGB(
                        255,
                        97,
                        151,
                        213,
                      ), // Màu đỏ cho nút báo cáo
                      padding: const EdgeInsets.symmetric(
                        horizontal:
                            40, // Có thể điều chỉnh padding ngang nếu muốn
                        vertical: 15,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      elevation: 5,
                    ),
                  ),
                ),
                // const SizedBox(height: 10), // Khoảng trống dưới nút báo cáo

                // ...existing code...
                const SizedBox(height: 10), // Khoảng trống dưới nút báo cáo
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
