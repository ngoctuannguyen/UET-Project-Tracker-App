import 'package:flutter/material.dart';
import 'package:app/models/user_model.dart';
import 'package:app/screens/chat_screen.dart'; // Import nếu cần nút chat

class ProjectDetailScreen extends StatefulWidget {
  final String projectTitle;
  final UserModel currentUser;

  const ProjectDetailScreen({
    Key? key,
    required this.projectTitle,
    required this.currentUser,
  }) : super(key: key);

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  // TODO: Thêm state và logic cho chi tiết dự án (tasks, members, etc.)

  @override
  void initState() {
    super.initState();
    print(
      'ProjectDetailScreen initState for ${widget.projectTitle}, user: ${widget.currentUser.fullName}',
    );
    // TODO: Load chi tiết dự án dựa trên widget.projectTitle hoặc ID dự án
  }

  // Widget helper tạo một thẻ Task (Ví dụ)
  Widget _buildTaskCard({
    required String date,
    String? subtitle,
    required IconData statusIcon,
    required Color statusIconColor,
    Widget? statusWidget,
  }) {
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
              // TODO: Implement task options menu
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
          onPressed: () => Navigator.pop(context), // Quay lại màn hình trước
        ),
        title: Text(
          widget.projectTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        // actions: [
        //   IconButton(
        //     icon: Icon(Icons.chat_bubble_outline),
        //     onPressed: () {
        //       // TODO: Lấy groupId của dự án này
        //       String groupId = 'group_id_for_${widget.projectTitle}';
        //       Navigator.push(
        //         context,
        //         MaterialPageRoute(
        //           builder: (context) => ChatScreen(
        //             chatTargetId: groupId,
        //             chatTargetName: widget.projectTitle,
        //             currentUser: widget.currentUser,
        //           ),
        //         ),
        //       );
        //     },
        //   ),
        // ],
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
          child: ListView(
            // Sử dụng ListView để có thể cuộn nếu nội dung dài
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            children: <Widget>[
              const SizedBox(height: kToolbarHeight + 10),
              CircleAvatar(
                radius: 55,
                backgroundColor: Colors.white54,
                child: Text(
                  userInitial,
                  style: TextStyle(fontSize: 40, color: Colors.deepPurple[400]),
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
              const SizedBox(height: 30),
              Text(
                'Công việc / Thành tích', // Tiêu đề cho phần task
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 15),
              // TODO: Hiển thị danh sách công việc/thành tích thực tế của dự án này
              _buildTaskCard(
                date: 'Ngày 19/2/2025',
                statusIcon: Icons.check_circle,
                statusIconColor: Colors.green,
              ),
              _buildTaskCard(
                date: 'Ngày 19/2/2025',
                subtitle: 'Còn 2h34p nữa',
                statusIcon: Icons.sync,
                statusIconColor: Colors.orangeAccent,
              ),
              _buildTaskCard(
                date: 'Ngày 19/2/2025',
                subtitle: 'Trễ 30p',
                statusIcon: Icons.error_outline,
                statusIconColor: Colors.redAccent,
              ),
              // Thêm các task card khác...
            ],
          ),
        ),
      ),
      // Không cần BottomNavigationBar ở đây nếu đây là màn hình chi tiết
    );
  }
}
