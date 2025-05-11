import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chat_screen.dart';
import 'package:app/models/user_model.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// Cấu trúc thông tin nhóm chat để hiển thị
class GroupChatDisplayInfo {
  final String id; // group_id từ backend
  final String name; // group_name từ backend
  final String lastMessage; // Có thể thêm nếu API trả về
  final String time; // Có thể thêm nếu API trả về
  final IconData icon; // Icon tùy chọn

  GroupChatDisplayInfo({
    required this.id,
    required this.name,
    this.lastMessage = "Chưa có tin nhắn",
    this.time = "",
    this.icon = Icons.group_work,
  });

  factory GroupChatDisplayInfo.fromJson(Map<String, dynamic> json) {
    return GroupChatDisplayInfo(
      id: json['group_id'] ?? json['id'] ?? '', // Ưu tiên group_id
      name: json['group_name'] ?? json['name'] ?? 'Unnamed Group',
      // lastMessage: json['last_message'] ?? "Chưa có tin nhắn", // Ví dụ
      // time: json['last_message_time'] ?? "", // Ví dụ
    );
  }
}

class FriendsListScreen extends StatefulWidget {
  final UserModel currentUser;

  const FriendsListScreen({Key? key, required this.currentUser})
    : super(key: key);

  @override
  State<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends State<FriendsListScreen> {
  int _selectedIndex = 1;

  // --- Configuration ---
  // CHẠY TRÊN CHROME NÊN DÙNG localhost
  static const String _chatServiceBaseUrl =
      'http://localhost:3002'; // <<< PORT 3002
  static const String _userServiceBaseUrl =
      'http://localhost:3001'; // Giả sử user-service chạy ở port 3001
  // ---

  List<GroupChatDisplayInfo> _groupChats = [];
  bool _isLoadingGroups = true;

  bool _isLoadingDialogMembers = false;
  List<Map<String, String>> _dialogMembersList = [];

  @override
  void initState() {
    super.initState();
    print(
      'FriendsListScreen initState: currentUser is ${widget.currentUser.fullName}, ID: ${widget.currentUser.docId}',
    );
    _loadGroupChats();
  }

  Future<void> _loadGroupChats() async {
    if (!mounted) return;
    setState(() {
      _isLoadingGroups = true;
    });
    try {
      final url = Uri.parse(
        '$_chatServiceBaseUrl/api/users/${widget.currentUser.docId}/groups',
      );
      print("Fetching groups from: $url for user ${widget.currentUser.docId}");

      final response = await http.get(url);

      if (!mounted) return;

      if (response.statusCode == 200) {
        final List<dynamic> groupsJson = jsonDecode(response.body);
        setState(() {
          _groupChats =
              groupsJson
                  .map(
                    (json) => GroupChatDisplayInfo.fromJson(
                      json as Map<String, dynamic>,
                    ),
                  )
                  .toList();
          _isLoadingGroups = false;
        });
        print("Loaded ${_groupChats.length} groups.");
      } else {
        print('Failed to load groups: ${response.statusCode} ${response.body}');
        setState(() {
          _isLoadingGroups = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi tải danh sách nhóm: ${response.statusCode}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Error loading groups: $e');
      if (mounted) {
        setState(() {
          _isLoadingGroups = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi kết nối tải nhóm: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _fetchAndShowGroupMembers(
    BuildContext context,
    GroupChatDisplayInfo group,
  ) async {
    if (!mounted) return;
    setState(() {
      _isLoadingDialogMembers = true;
      _dialogMembersList = [];
    });

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          // Cho phép cập nhật UI bên trong dialog
          builder: (BuildContext context, StateSetter setDialogState) {
            return AlertDialog(
              title: Text('Thành viên nhóm "${group.name}"'),
              content: SizedBox(
                width: double.maxFinite,
                height: MediaQuery.of(context).size.height * 0.4,
                child:
                    _isLoadingDialogMembers
                        ? const Center(child: CircularProgressIndicator())
                        : (_dialogMembersList.isEmpty
                            ? const Center(
                              child: Text(
                                'Không có thành viên hoặc lỗi tải dữ liệu.',
                              ),
                            )
                            : ListView.builder(
                              shrinkWrap: true,
                              itemCount: _dialogMembersList.length,
                              itemBuilder: (ctx, index) {
                                final member = _dialogMembersList[index];
                                final isCurrentUser =
                                    member['id'] == widget.currentUser.docId;
                                return ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor:
                                        isCurrentUser
                                            ? Theme.of(
                                              context,
                                            ).primaryColorLight
                                            : Colors.grey[300],
                                    child: Text(
                                      member['name']!.isNotEmpty
                                          ? member['name']![0].toUpperCase()
                                          : '?',
                                    ),
                                  ),
                                  title: Text(
                                    member['name']!,
                                    style: TextStyle(
                                      fontWeight:
                                          isCurrentUser
                                              ? FontWeight.bold
                                              : FontWeight.normal,
                                    ),
                                  ),
                                );
                              },
                            )),
              ),
              actions: <Widget>[
                if (!_isLoadingDialogMembers)
                  TextButton(
                    child: const Text('Đóng'),
                    onPressed: () {
                      Navigator.of(dialogContext).pop();
                      // Reset state sau khi đóng dialog để lần sau mở lại không bị lỗi state cũ
                      if (mounted) {
                        setState(() {
                          _isLoadingDialogMembers = false;
                          _dialogMembersList = [];
                        });
                      }
                    },
                  ),
              ],
            );
          },
        );
      },
    );

    // Bắt đầu tải dữ liệu
    try {
      final memberIdsUrl = Uri.parse(
        '$_chatServiceBaseUrl/api/groups/${group.id}/members',
      );
      print("Fetching member IDs from: $memberIdsUrl");
      final memberIdsResponse = await http.get(memberIdsUrl);

      if (!mounted) return;
      if (memberIdsResponse.statusCode != 200) {
        throw Exception(
          'Lỗi tải ID thành viên: ${memberIdsResponse.statusCode} - ${memberIdsResponse.body}',
        );
      }
      final List<dynamic> idsJson = jsonDecode(memberIdsResponse.body);
      final List<String> memberIds =
          idsJson.map((id) => id.toString()).toList();
      print("Fetched member IDs: $memberIds");

      List<Map<String, String>> fetchedMembersTemp = [];
      for (String userId in memberIds) {
        // API của user-service để lấy thông tin user
        final userUrl = Uri.parse('$_userServiceBaseUrl/api/user/$userId');
        print("Fetching user details for $userId from $userUrl");
        final userResponse = await http.get(userUrl);

        if (!mounted) return;
        if (userResponse.statusCode == 200) {
          final userJson = jsonDecode(userResponse.body);
          // Đảm bảo user-service trả về trường 'fullName' hoặc 'name'
          // Và user_uid là docId của user document trong user_service
          // Cấu trúc userJson có thể là { "user": { "fullName": "...", "user_id": "..." } }
          // hoặc { "fullName": "...", "user_id": "..." }
          // Điều chỉnh cho phù hợp với API user-service của bạn
          String name = 'Unknown User';
          String id = userId; // Mặc định là userId truyền vào

          if (userJson['user'] != null) {
            // Kiểm tra xem có object 'user' không
            final userData = userJson['user'];
            if (userData['fullName'] != null) {
              name = userData['fullName'];
            } else if (userData['name'] != null) {
              // Nếu không có fullName thì thử 'name'
              name = userData['name'];
            } else if (userData['displayName'] != null &&
                (userData['firestoreDataMissing'] == true)) {
              // Trường hợp chỉ có dữ liệu từ Auth
              name = userData['displayName'];
            }

            // Lấy user_id từ response nếu có, ưu tiên hơn userId ban đầu
            if (userData['user_id'] != null) {
              id = userData['user_id'];
            } else if (userData['uid'] != null) {
              // Nếu là dữ liệu từ Auth thì có thể là 'uid'
              id = userData['uid'];
            }
          }

          fetchedMembersTemp.add({'id': id, 'name': name});
        } else {
          print(
            'Lỗi tải thông tin user $userId: ${userResponse.statusCode} - ${userResponse.body}',
          );
          fetchedMembersTemp.add({'id': userId, 'name': 'User $userId (Lỗi)'});
        }
      }

      if (mounted) {
        setState(() {
          // Gọi setState của _FriendsListScreenState
          _dialogMembersList = fetchedMembersTemp;
          _isLoadingDialogMembers = false;
        });
      }
    } catch (e) {
      print('Lỗi khi tải thông tin thành viên: $e');
      if (mounted) {
        setState(() {
          _isLoadingDialogMembers = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải thành viên: $e'),
            backgroundColor: Colors.red,
          ),
        );
        // Tự động đóng dialog nếu có lỗi nghiêm trọng
        // Navigator.of(this.context).pop();
      }
    }
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index &&
        index != 1 /* Allow re-tap for refresh on group list? */ )
      return;

    // Cập nhật _selectedIndex trước khi điều hướng để UI phản hồi ngay
    if (mounted) {
      setState(() {
        _selectedIndex = index;
      });
    }

    switch (index) {
      case 0:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser),
          ),
        );
        break;
      case 1:
        // Đang ở đây, có thể thêm logic refresh nếu muốn
        _loadGroupChats();
        break;
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CameraScreen(currentUser: widget.currentUser),
          ),
        );
        break;
      // case 3:
      //   Navigator.pushReplacement(
      //     context,
      //     MaterialPageRoute(
      //       builder:
      //           (context) => ChatBotScreen(currentUser: widget.currentUser),
      //     ),
      //   );
      //   break;
      case 4:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => SettingsScreen(currentUser: widget.currentUser),
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách nhóm'),
        backgroundColor: Colors.blueAccent,
        automaticallyImplyLeading:
            false, // Không hiển thị nút back nếu đây là tab chính
      ),
      body:
          _isLoadingGroups
              ? const Center(child: CircularProgressIndicator())
              : (_groupChats.isEmpty
                  ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.group_off_outlined,
                            size: 60,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Bạn chưa tham gia nhóm chat nào.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.refresh),
                            label: const Text('Tải lại danh sách'),
                            onPressed: _loadGroupChats,
                          ),
                        ],
                      ),
                    ),
                  )
                  : RefreshIndicator(
                    onRefresh: _loadGroupChats,
                    child: ListView.separated(
                      itemCount: _groupChats.length,
                      separatorBuilder:
                          (context, index) => const Divider(
                            height: 1,
                            indent: 70,
                            endIndent: 16,
                          ),
                      itemBuilder: (context, index) {
                        final group = _groupChats[index];
                        return ListTile(
                          leading: CircleAvatar(
                            child: Icon(group.icon, color: Colors.white),
                            backgroundColor: Colors
                                .accents[index % Colors.accents.length]
                                .withOpacity(0.8),
                          ),
                          title: Text(
                            group.name,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                          subtitle: Text(
                            group.lastMessage,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: IconButton(
                            icon: const Icon(
                              Icons.info_outline,
                              color: Colors.blueGrey,
                            ),
                            tooltip: 'Xem thành viên',
                            onPressed:
                                () => _fetchAndShowGroupMembers(context, group),
                          ),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder:
                                    (context) => ChatScreen(
                                      chatTargetId: group.id,
                                      chatTargetName: group.name,
                                      currentUser: widget.currentUser,
                                    ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  )),
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
            label: 'Chat Bot',
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
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        backgroundColor: Colors.white,
        elevation: 8.0,
      ),
    );
  }
}
