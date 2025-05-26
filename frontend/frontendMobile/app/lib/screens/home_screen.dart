import 'package:flutter/material.dart';
import 'package:app/screens/project_detail_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart';
import 'package:app/models/project_model.dart'; // <<< THÊM
import 'package:app/services/project_service.dart'; // <<< THÊM
import 'package:app/services/auth_service.dart'; // <<< THÊM
import 'package:app/screens/login_screen.dart'; // <<< THÊM

class HomeScreen extends StatefulWidget {
  final UserModel currentUser;
  const HomeScreen({Key? key, required this.currentUser}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final ProjectService _projectService = ProjectService(); // <<< THÊM
  final AuthService _authService = AuthService(); // <<< THÊM
  late Future<List<ProjectModel>> _projectsFuture;

  @override
  void initState() {
    super.initState();
    print(
      'HomeScreen initState: currentUser is ${widget.currentUser.fullName}, docId: ${widget.currentUser.docId}, userId: ${widget.currentUser.userId}',
    );
    _loadProjects();
  }

  void _loadProjects() {
    // widget.currentUser.userId chính là employeeId cần truyền
    if (widget.currentUser.userId.isEmpty) {
      print("Lỗi: currentUser.userId rỗng, không thể tải dự án.");
      setState(() {
        _projectsFuture = Future.value(
          [],
        ); // Trả về future rỗng để FutureBuilder không lỗi
      });
      // Có thể hiển thị thông báo lỗi cho người dùng
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Lỗi: Không tìm thấy mã nhân viên của bạn.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      });
      return;
    }
    setState(() {
      _projectsFuture = _projectService.getProjectsForEmployee(
        widget.currentUser.userId,
      );
    });
  }

  Future<void> _handleApiError(dynamic error) async {
    if (!mounted) return;
    print("API Error in HomeScreen: $error");
    String errorMessage = "Đã xảy ra lỗi khi tải dữ liệu.";
    if (error.toString().contains('Authentication failed')) {
      errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      await _authService.deleteToken();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (Route<dynamic> route) => false,
      );
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
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
      case 3: // Settings
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
              onTap: () => _onItemTapped(3), // Chuyển đến Settings (index 3)
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
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Dự án của bạn',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, color: Colors.white70),
                      onPressed:
                          _loadProjects, // Nút để tải lại danh sách dự án
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Expanded(
                  // <<< SỬ DỤNG EXPANDED CHO FUTUREBUILDER
                  child: FutureBuilder<List<ProjectModel>>(
                    future: _projectsFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        );
                      } else if (snapshot.hasError) {
                        // Gọi _handleApiError nếu chưa được gọi từ _loadProjects
                        // (ví dụ, nếu lỗi xảy ra trong chính FutureBuilder)
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (snapshot.error.toString().contains(
                                "Failed to load projects",
                              ) ||
                              snapshot.error.toString().contains(
                                "Error fetching projects",
                              )) {
                            // Lỗi chung, không phải auth
                          } else {
                            _handleApiError(snapshot.error);
                          }
                        });
                        return Center(
                          child: Text(
                            'Lỗi: ${snapshot.error}',
                            style: const TextStyle(color: Colors.white70),
                          ),
                        );
                      } else if (snapshot.hasData &&
                          snapshot.data!.isNotEmpty) {
                        final projects = snapshot.data!;
                        return ListView.builder(
                          itemCount: projects.length,
                          itemBuilder: (context, index) {
                            final project = projects[index];
                            IconData statusIconData;
                            Color statusColor;
                            switch (project.status) {
                              case 'done':
                                statusIconData = Icons.check_circle;
                                statusColor = Colors.green;
                                break;
                              case 'in progress':
                                statusIconData = Icons.sync;
                                statusColor = Colors.orangeAccent;
                                break;
                              default: // not started
                                statusIconData = Icons.play_circle_outline;
                                statusColor = Colors.grey;
                            }
                            return _buildProjectCard(
                              project: project, // <<< TRUYỀN PROJECT MODEL
                              iconData:
                                  Icons.business_center, // Icon chung cho dự án
                              statusIcon: statusIconData,
                              statusIconColor: statusColor,
                              context: context,
                            );
                          },
                        );
                      } else {
                        return const Center(
                          child: Text(
                            'Bạn chưa tham gia dự án nào.',
                            style: TextStyle(color: Colors.white70),
                          ),
                        );
                      }
                    },
                  ),
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
    required ProjectModel project, // <<< NHẬN PROJECT MODEL
    required IconData iconData,
    required IconData statusIcon,
    required Color statusIconColor,
    required BuildContext context,
  }) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => ProjectDetailScreen(
                  project: project, // <<< TRUYỀN PROJECT MODEL
                  currentUser: widget.currentUser,
                ),
            settings: RouteSettings(
              name: '/projectDetail/${project.productCode}',
            ),
          ),
        );
        print('Navigating to details for: ${project.name}');
      },
      borderRadius: BorderRadius.circular(25),
      child: Container(
        margin: const EdgeInsets.only(bottom: 15), // Thêm margin giữa các card
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    project.name, // <<< HIỂN THỊ TÊN DỰ ÁN
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (project.projectDue != null)
                    Text(
                      'Hạn: ${project.projectDue!.day}/${project.projectDue!.month}/${project.projectDue!.year}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              // Hiển thị % tiến độ và icon
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Icon(statusIcon, color: statusIconColor, size: 28),
                Text(
                  '${(project.progress).toStringAsFixed(0)}%',
                  style: TextStyle(fontSize: 12, color: statusIconColor),
                ),
              ],
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () {
                print(
                  'Options for ${project.name} pressed',
                ); /* TODO: Implement options menu */
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
