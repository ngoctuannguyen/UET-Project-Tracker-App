import 'package:flutter/material.dart';
import 'package:app/models/user_model.dart';
import 'package:app/models/project_model.dart'; // <<< THÊM
import 'package:app/models/component_model.dart'; // <<< THÊM
import 'package:app/services/project_service.dart'; // <<< THÊM
import 'package:app/services/auth_service.dart'; // <<< THÊM
import 'package:app/screens/login_screen.dart'; // <<< THÊM

class ProjectDetailScreen extends StatefulWidget {
  final ProjectModel project; // <<< NHẬN PROJECT MODEL
  final UserModel currentUser;

  const ProjectDetailScreen({
    Key? key,
    required this.project,
    required this.currentUser,
  }) : super(key: key);

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  final ProjectService _projectService = ProjectService(); // <<< THÊM
  final AuthService _authService = AuthService(); // <<< THÊM
  late Future<List<ComponentModel>> _componentsFuture;

  @override
  void initState() {
    super.initState();
    print(
      'ProjectDetailScreen initState for ${widget.project.name}, user: ${widget.currentUser.fullName}, employeeId: ${widget.currentUser.userId}',
    );
    _loadComponents();
  }

  void _loadComponents() {
    if (widget.currentUser.userId.isEmpty) {
      print("Lỗi: currentUser.userId rỗng, không thể tải components.");
      setState(() {
        _componentsFuture = Future.value([]);
      });
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
      _componentsFuture = _projectService.getComponentsForProjectByEmployee(
        widget.project.productCode,
        widget.currentUser.userId, // employeeId của người dùng hiện tại
      );
    });
  }

  Future<void> _handleApiError(dynamic error) async {
    if (!mounted) return;
    print("API Error in ProjectDetailScreen: $error");
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

  Widget _buildTaskCard({
    // Đổi tên thành _buildComponentCard cho rõ nghĩa
    required ComponentModel component,
    // required String date, // Sẽ lấy từ component nếu có
    // String? subtitle,
    // required IconData statusIcon,
    // required Color statusIconColor,
    // Widget? statusWidget,
  }) {
    IconData statusIconData;
    Color statusColor;
    String statusText = component.isCompleted;

    switch (component.isCompleted) {
      case 'done':
        statusIconData = Icons.check_circle_outline;
        statusColor = Colors.green;
        statusText = 'Hoàn thành';
        break;
      case 'in progress':
        statusIconData = Icons.sync;
        statusColor = Colors.orangeAccent;
        statusText = 'Đang làm';
        break;
      default: // not started
        statusIconData = Icons.play_circle_outline;
        statusColor = Colors.grey;
        statusText = 'Chưa bắt đầu';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
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
              Icons.build_circle_outlined,
              color: Colors.white,
              size: 24,
            ), // Icon cho component
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  component.name, // Tên component
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  statusText, // Trạng thái text
                  style: TextStyle(fontSize: 13, color: statusColor),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Icon(statusIconData, color: statusColor, size: 28),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              print(
                'Options for component ${component.name} pressed',
              ); /* TODO: Implement task options menu */
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

  @override
  Widget build(BuildContext context) {
    // ... (giữ nguyên phần AppBar và thông tin user) ...
    final user = widget.currentUser;
    final userInitial =
        user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : '?';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87, size: 30),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.project.name, // <<< HIỂN THỊ TÊN DỰ ÁN
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: Container(
        // ... (giữ nguyên decoration gradient) ...
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
          child: Column(
            // Sử dụng Column để thêm tiêu đề và nút refresh
            children: [
              Padding(
                padding: const EdgeInsets.only(
                  left: 16.0,
                  right: 16.0,
                  top: kToolbarHeight + 10,
                ),
                child: Column(
                  children: [
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
                      user.fullName,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16.0,
                  vertical: 15.0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Công việc của bạn trong dự án',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, color: Colors.white70),
                      onPressed: _loadComponents,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: FutureBuilder<List<ComponentModel>>(
                    future: _componentsFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(color: Colors.white),
                        );
                      } else if (snapshot.hasError) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (snapshot.error.toString().contains(
                                "Failed to load components",
                              ) ||
                              snapshot.error.toString().contains(
                                "Error fetching components",
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
                        final components = snapshot.data!;
                        return ListView.builder(
                          itemCount: components.length,
                          itemBuilder: (context, index) {
                            final component = components[index];
                            return _buildTaskCard(
                              component: component,
                            ); // Sử dụng _buildTaskCard đã sửa
                          },
                        );
                      } else {
                        return const Center(
                          child: Text(
                            'Bạn không có công việc nào trong dự án này.',
                            style: TextStyle(color: Colors.white70),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
