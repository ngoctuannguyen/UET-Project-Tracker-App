import 'dart:io';
import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/report_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel

class ImageSearchResultScreen extends StatefulWidget {
  final String imagePath;
  // <<< THÊM: Nhận currentUser (có thể null) >>>
  final UserModel? currentUser;

  const ImageSearchResultScreen({
    Key? key,
    required this.imagePath,
    this.currentUser, // Thêm vào constructor
  }) : super(key: key);

  @override
  State<ImageSearchResultScreen> createState() =>
      _ImageSearchResultScreenState();
}

class _ImageSearchResultScreenState extends State<ImageSearchResultScreen> {
  int _selectedIndex = 2; // Index của Camera
  String _searchResult = '(Chưa có kết quả)';
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    print(
      'ImageSearchResultScreen initState: currentUser is ${widget.currentUser?.fullName}',
    );
    _performImageSearch();
  }

  // Hàm gọi API tìm kiếm ảnh (giả lập)
  Future<void> _performImageSearch() async {
    if (!mounted) return;
    setState(() {
      _isSearching = true;
      _searchResult = 'Đang tìm kiếm...';
    });

    try {
      await Future.delayed(const Duration(seconds: 2)); // Giả lập độ trễ mạng
      // TODO: Thay thế bằng logic gọi API thực tế
      final result = "Tìm thấy đối tượng X tại vị trí Y"; // Kết quả giả lập
      if (mounted) {
        setState(() {
          _searchResult = result;
          _isSearching = false;
        });
      }
    } catch (e) {
      print("Lỗi khi tìm kiếm ảnh: $e");
      if (mounted) {
        setState(() {
          _searchResult = 'Lỗi khi tìm kiếm: $e';
          _isSearching = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi tìm kiếm ảnh: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    // Không có controller nào cần dispose trong ví dụ này
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    // Kiểm tra currentUser trước khi điều hướng đến các màn hình yêu cầu đăng nhập
    if (widget.currentUser == null && index != 2) {
      print(
        "Lỗi: currentUser là null, không thể điều hướng đến màn hình khác ngoài Camera.",
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lỗi thông tin người dùng, không thể chuyển màn hình.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Điều hướng bằng pushReplacement
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser!),
            settings: const RouteSettings(name: '/home'),
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
            settings: const RouteSettings(name: '/friends'),
          ),
        );
        break;
      case 2: // Camera
        // Quay lại màn hình Camera, truyền lại currentUser (có thể null)
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
                (context) => ChatbotScreen(currentUser: widget.currentUser!),
            settings: const RouteSettings(name: '/chatbot'),
          ),
        );
        break;
      case 4: // Settings
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => SettingsScreen(currentUser: widget.currentUser!),
            settings: const RouteSettings(name: '/settings'),
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.currentUser;
    final userDisplayName = user?.fullName ?? 'Người dùng';
    final userInitial =
        userDisplayName.isNotEmpty ? userDisplayName[0].toUpperCase() : '?';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87, size: 30),
          onPressed: () {
            // Quay lại CameraScreen, truyền lại currentUser
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder:
                    (context) => CameraScreen(currentUser: widget.currentUser),
                settings: const RouteSettings(name: '/camera'),
              ),
            );
          },
        ),
        title: const Text(
          'Kết quả',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      extendBodyBehindAppBar: true,
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
                const SizedBox(height: kToolbarHeight - 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.grey[300],
                      child: Text(
                        userInitial,
                        style: const TextStyle(
                          fontSize: 24,
                          color: Colors.black54,
                        ),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Container(
                        height: 50,
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.black54, width: 0.5),
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            userDisplayName,
                            style: const TextStyle(
                              color: Colors.black87,
                              fontSize: 16,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 25),
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
                        return const Center(
                          child: Icon(
                            Icons.error_outline,
                            color: Colors.redAccent,
                            size: 50,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 25),
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
                    padding: const EdgeInsets.all(15.0),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child:
                          _isSearching
                              ? const CircularProgressIndicator()
                              : Text(
                                _searchResult,
                                style: TextStyle(
                                  color:
                                      _searchResult.startsWith('Lỗi')
                                          ? Colors.red
                                          : Colors.black87,
                                  fontSize: 16,
                                ),
                                textAlign: TextAlign.center,
                              ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: ElevatedButton(
                    child: const Text(
                      'Báo cáo',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: () {
                      // <<< SỬA: Truyền currentUser sang ReportScreen >>>
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder:
                              (context) => ReportScreen(
                                imagePath: widget.imagePath,
                                // currentUser: widget.currentUser, // TODO: Add currentUser to ReportScreen if needed
                              ),
                          settings: const RouteSettings(name: '/report'),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 15,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      elevation: 5,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
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
