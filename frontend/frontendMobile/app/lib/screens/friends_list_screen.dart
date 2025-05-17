import 'package:flutter/material.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/camera_screen.dart';
// import 'package:app/screens/chatbot_screen.dart'; // Bỏ comment nếu bạn có màn hình này
import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chat_screen.dart';
import 'package:app/models/user_model.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:app/services/auth_service.dart'; // <<< THÊM: Import AuthService
import 'package:app/screens/login_screen.dart'; // <<< THÊM: Import LoginScreen để điều hướng nếu token hết hạn

// Cấu trúc thông tin nhóm chat để hiển thị
class GroupChatDisplayInfo {
  final String id;
  final String name;
  final String lastMessage;
  final String time;
  final IconData icon;

  GroupChatDisplayInfo({
    required this.id,
    required this.name,
    this.lastMessage = "Chưa có tin nhắn",
    this.time = "",
    this.icon = Icons.group_work,
  });

  factory GroupChatDisplayInfo.fromJson(Map<String, dynamic> json) {
    return GroupChatDisplayInfo(
      id: json['id'] ?? '', // API của bạn trả về 'id' cho group
      name: json['group_name'] ?? json['name'] ?? 'Unnamed Group',
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

  static const String _chatServiceBaseUrl = 'http://localhost:3002';
  static const String _userServiceBaseUrl = 'http://localhost:3001';

  final AuthService _authService =
      AuthService(); // <<< THÊM: Khởi tạo AuthService

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

  Future<void> _handleApiError(dynamic e, int? statusCode) async {
    print('API Error: $e, Status Code: $statusCode');
    if (mounted) {
      String message = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      if (statusCode == 401 || statusCode == 403) {
        message =
            'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
        await _authService.deleteToken();
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (Route<dynamic> route) => false,
        );
      } else if (e is http.ClientException) {
        message = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _loadGroupChats() async {
    if (!mounted) return;
    setState(() {
      _isLoadingGroups = true;
    });
    try {
      // <<< THÊM: Lấy token >>>
      final String? token = await _authService.getToken();
      if (token == null) {
        print(
          "Error loading groups: No auth token found. User might need to login again.",
        );
        if (mounted) {
          _handleApiError("Token not found", 401); // Xử lý như lỗi 401
        }
        setState(() => _isLoadingGroups = false);
        return;
      }

      final url = Uri.parse(
        '$_chatServiceBaseUrl/api/users/${widget.currentUser.docId}/groups',
      );
      print("Fetching groups from: $url for user ${widget.currentUser.docId}");

      // <<< THÊM: Headers với Authorization token >>>
      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

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
        });
        print("Loaded ${_groupChats.length} groups.");
      } else {
        _handleApiError(response.body, response.statusCode);
      }
    } catch (e) {
      _handleApiError(e, null);
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingGroups = false;
        });
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

    // <<< THÊM: Lấy token >>>
    final String? token = await _authService.getToken();
    if (token == null) {
      print("Error fetching group members: No auth token found.");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Lỗi xác thực. Vui lòng đăng nhập lại để xem thành viên.',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
      // Không hiển thị dialog nếu không có token, hoặc đóng dialog nếu đang mở
      if (Navigator.canPop(context)) Navigator.pop(context);
      setState(() => _isLoadingDialogMembers = false);
      return;
    }

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setDialogState) {
            // Cập nhật _isLoadingDialogMembers và _dialogMembersList bên trong dialog
            // bằng cách gọi setDialogState khi dữ liệu thay đổi
            // Điều này cần một chút cấu trúc lại nếu bạn muốn dialog tự cập nhật
            // Cách đơn giản hơn là đóng và mở lại dialog, hoặc truyền callback
            // Hiện tại, chúng ta sẽ cập nhật state của _FriendsListScreenState
            // và dialog sẽ rebuild dựa trên state đó.

            // Để dialog tự cập nhật, bạn cần quản lý state _isLoadingDialogMembers và _dialogMembersList
            // bên trong một StatefulWidget riêng cho nội dung dialog, hoặc dùng ValueNotifier.
            // Vì mục đích đơn giản, chúng ta sẽ dựa vào setState của _FriendsListScreenState.
            // Khi _fetchAndShowGroupMembers hoàn thành, nó sẽ gọi setState và dialog sẽ rebuild.

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
                if (!_isLoadingDialogMembers) // Chỉ hiển thị nút đóng khi không loading
                  TextButton(
                    child: const Text('Đóng'),
                    onPressed: () {
                      Navigator.of(dialogContext).pop();
                    },
                  ),
              ],
            );
          },
        );
      },
    );

    // Bắt đầu tải dữ liệu sau khi dialog đã hiển thị
    try {
      final memberIdsUrl = Uri.parse(
        '$_chatServiceBaseUrl/api/groups/${group.id}/members',
      );
      print("Fetching member IDs from: $memberIdsUrl");
      // <<< THÊM: Headers với Authorization token >>>
      final memberIdsResponse = await http.get(
        memberIdsUrl,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (!mounted) return;

      if (memberIdsResponse.statusCode != 200) {
        _handleApiError(memberIdsResponse.body, memberIdsResponse.statusCode);
        // Đóng dialog nếu có lỗi
        if (Navigator.canPop(context)) Navigator.pop(context);
        setState(
          () => _isLoadingDialogMembers = false,
        ); // Cập nhật state loading
        return;
      }

      final List<dynamic> idsJson = jsonDecode(memberIdsResponse.body);
      final List<String> memberIds =
          idsJson.map((id) => id.toString()).toList();
      print("Fetched member IDs: $memberIds");

      List<Map<String, String>> fetchedMembersTemp = [];
      for (String userIdInGroup in memberIds) {
        final userUrl = Uri.parse(
          '$_userServiceBaseUrl/api/user/$userIdInGroup',
        );
        print("Fetching user details for $userIdInGroup from $userUrl");

        // Giả sử user-service không cần token, nếu cần thì thêm header tương tự
        // final String? userServiceToken = await _authService.getToken(); // Nếu user-service cũng cần token
        final userResponse = await http.get(
          userUrl,
          // headers: userServiceToken != null ? {'Authorization': 'Bearer $userServiceToken'} : {},
        );

        if (!mounted) return;
        if (userResponse.statusCode == 200) {
          final userJson = jsonDecode(userResponse.body);
          String name = 'Unknown User';
          String id = userIdInGroup;

          if (userJson['user'] != null) {
            final userData = userJson['user'];
            name =
                userData['fullName'] ??
                userData['name'] ??
                userData['displayName'] ??
                'User';
            id = userData['user_id'] ?? userData['uid'] ?? userIdInGroup;
          } else {
            // Trường hợp user-service trả về trực tiếp thông tin user
            name =
                userJson['fullName'] ??
                userJson['name'] ??
                userJson['displayName'] ??
                'User';
            id = userJson['user_id'] ?? userJson['uid'] ?? userIdInGroup;
          }
          fetchedMembersTemp.add({'id': id, 'name': name});
        } else {
          print(
            'Lỗi tải thông tin user $userIdInGroup: ${userResponse.statusCode} - ${userResponse.body}',
          );
          fetchedMembersTemp.add({
            'id': userIdInGroup,
            'name': 'User $userIdInGroup (Lỗi)',
          });
        }
      }

      if (mounted) {
        // Cập nhật state của _FriendsListScreenState để dialog rebuild
        setState(() {
          _dialogMembersList = fetchedMembersTemp;
          _isLoadingDialogMembers = false;
        });
      }
    } catch (e) {
      _handleApiError(e, null);
      if (mounted) {
        // Đóng dialog nếu có lỗi
        if (Navigator.canPop(context)) Navigator.pop(context);
        setState(() {
          _isLoadingDialogMembers = false;
        });
      }
    }
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index && index != 1) return;

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
        _loadGroupChats(); // Refresh list
        break;
      case 2:
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => CameraScreen(currentUser: widget.currentUser),
          ),
        );
        break;
      // case 3: // ChatBotScreen
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
        automaticallyImplyLeading: false,
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
                                      chatTargetId: group.id, // Đây là group_id
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
            // ChatBot item
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
