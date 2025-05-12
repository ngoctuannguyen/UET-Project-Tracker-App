import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb; // <<< THÊM IMPORT NÀY
import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/report_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart';

class ImageSearchResultScreen extends StatefulWidget {
  final String imagePath;
  final UserModel? currentUser;

  const ImageSearchResultScreen({
    Key? key,
    required this.imagePath,
    this.currentUser,
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

  Future<void> _performImageSearch() async {
    if (!mounted) return;
    setState(() {
      _isSearching = true;
      _searchResult = 'Đang tìm kiếm...';
    });

    try {
      await Future.delayed(const Duration(seconds: 2));
      final result = "Tìm thấy đối tượng X tại vị trí Y";
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
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

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

    switch (index) {
      case 0:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser!),
            settings: const RouteSettings(name: '/home'),
          ),
        );
        break;
      case 1:
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
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CameraScreen(currentUser: widget.currentUser),
            settings: const RouteSettings(name: '/camera'),
          ),
        );
        break;
      case 3:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => ChatbotScreen(currentUser: widget.currentUser!),
            settings: const RouteSettings(name: '/chatbot'),
          ),
        );
        break;
      case 4:
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
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
          ), // Đổi màu chữ tiêu đề cho dễ nhìn
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
                    // <<< THAY ĐỔI LOGIC HIỂN THỊ ẢNH TẠI ĐÂY >>>
                    child:
                        kIsWeb
                            ? Image.network(
                              // Sử dụng Image.network cho Web
                              widget.imagePath,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                print("Lỗi tải ảnh từ network (web): $error");
                                return const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.error_outline,
                                        color: Colors.redAccent,
                                        size: 40,
                                      ),
                                      SizedBox(height: 8),
                                      Text(
                                        'Lỗi tải ảnh (Web)',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            )
                            : Image.file(
                              // Sử dụng Image.file cho Mobile
                              File(widget.imagePath),
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                print("Lỗi tải ảnh từ file (mobile): $error");
                                return const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.error_outline,
                                        color: Colors.redAccent,
                                        size: 40,
                                      ),
                                      SizedBox(height: 8),
                                      Text(
                                        'Lỗi tải ảnh (Mobile)',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                    ],
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
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder:
                              (context) => ReportScreen(
                                imagePath: widget.imagePath,
                                // currentUser: widget.currentUser, // TODO: Cân nhắc truyền currentUser nếu ReportScreen cần
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
