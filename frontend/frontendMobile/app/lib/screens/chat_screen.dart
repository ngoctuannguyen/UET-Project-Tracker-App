import 'package:flutter/material.dart';
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:app/models/user_model.dart';
import 'package:intl/intl.dart';
import 'package:app/services/auth_service.dart';
import 'package:app/screens/login_screen.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    DateTime parsedTimestamp;
    try {
      if (json['timestamp'] is Map && json['timestamp']['_seconds'] != null) {
        // Firestore Timestamp object
        parsedTimestamp =
            DateTime.fromMillisecondsSinceEpoch(
              (json['timestamp']['_seconds'] * 1000 +
                      (json['timestamp']['_nanoseconds'] ?? 0) / 1000000)
                  .toInt(),
            ).toLocal();
      } else if (json['timestamp'] is String) {
        // ISO 8601 String
        parsedTimestamp = DateTime.parse(json['timestamp']).toLocal();
      } else if (json['timestamp'] is int) {
        // Unix timestamp in milliseconds
        parsedTimestamp =
            DateTime.fromMillisecondsSinceEpoch(json['timestamp']).toLocal();
      } else {
        // Fallback or log warning
        parsedTimestamp = DateTime.now().toLocal();
        print(
          "Warning: ChatMessage.fromJson received unrecognized timestamp format: ${json['timestamp']?.runtimeType} - ${json['timestamp']}",
        );
      }
    } catch (e) {
      print(
        "Error parsing timestamp in ChatMessage.fromJson: ${json['timestamp']} - $e",
      );
      parsedTimestamp = DateTime.now().toLocal(); // Fallback
    }

    return ChatMessage(
      id:
          json['id']?.toString() ??
          DateTime.now().millisecondsSinceEpoch
              .toString(), // Fallback ID if null
      senderId: json['sender_id']?.toString() ?? 'unknown_sender',
      senderName: json['sender_name']?.toString() ?? 'Unknown User',
      text: json['text']?.toString() ?? '',
      timestamp: parsedTimestamp,
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String chatTargetId; // Group ID
  final String chatTargetName; // Group Name
  final UserModel currentUser;

  const ChatScreen({
    Key? key,
    required this.chatTargetId,
    required this.chatTargetName,
    required this.currentUser,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  late IO.Socket socket;
  bool _isLoadingMessages = true;
  bool _isConnected = false;
  final AuthService _authService = AuthService();

  static const String _chatServiceBaseUrl = 'http://localhost:3002';
  static const String _userServiceBaseUrl = 'http://localhost:3000';

  @override
  void initState() {
    super.initState();
    print(
      'ChatScreen initState for group ${widget.chatTargetName} (ID: ${widget.chatTargetId}), user: ${widget.currentUser.fullName} (ID: ${widget.currentUser.docId})',
    );

    if (widget.chatTargetId.isEmpty) {
      print(
        "Error: chatTargetId is empty in ChatScreen initState. Cannot proceed.",
      );
      if (mounted) {
        setState(() {
          _isLoadingMessages = false;
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lỗi: Không thể mở phòng chat do thiếu ID nhóm.'),
                backgroundColor: Colors.red,
              ),
            );
            Navigator.of(context).pop();
          }
        });
      }
      return;
    }

    _connectSocket();
    _loadInitialMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    print("Disposing socket for group ${widget.chatTargetId}");
    try {
      socket.off('connect');
      socket.off('new-message');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.off(
        'send-message-error',
      ); // <<< THÊM: Gỡ listener lỗi gửi tin nhắn

      if (socket.connected) {
        socket.emit('leave-group', widget.chatTargetId);
        socket.disconnect();
      }
      socket.dispose();
    } catch (e) {
      print(
        "Error during socket disposal (socket might not have been initialized): $e",
      );
    }
    super.dispose();
  }

  Future<void> _handleApiError(
    dynamic e,
    int? statusCode, {
    BuildContext? dialogContext,
  }) async {
    print('API Error in ChatScreen: $e, Status Code: $statusCode');
    final currentContext =
        dialogContext ?? context; // Ưu tiên dialogContext nếu có
    if (mounted ||
        (dialogContext != null && Navigator.of(dialogContext).canPop())) {
      String message = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      if (statusCode == 401 || statusCode == 403) {
        message =
            'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
        await _authService.deleteToken();
        // Đảm bảo pop dialog trước khi điều hướng (nếu có)
        if (dialogContext != null && Navigator.of(dialogContext).canPop()) {
          Navigator.of(dialogContext).pop();
        }
        Navigator.of(this.context).pushAndRemoveUntil(
          // Sử dụng this.context của ChatScreen để điều hướng
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (Route<dynamic> route) => false,
        );
      } else if (e is http.ClientException) {
        message = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.';
      }
      ScaffoldMessenger.of(currentContext).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  void _connectSocket() {
    socket = IO.io(
      _chatServiceBaseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect() // Kết nối thủ công
          .setQuery({
            'userId': widget.currentUser.docId,
          }) // <<< THÊM: Gửi userId qua query
          // .setAuth({'token': 'YOUR_SOCKET_AUTH_TOKEN_IF_ANY'}) // Nếu socket có auth riêng
          .build(),
    );

    socket.connect();

    socket.onConnect((_) {
      if (!mounted) return;
      setState(() {
        _isConnected = true;
      });
      print('Socket connected: ${socket.id} for group ${widget.chatTargetId}');
      socket.emit('join-group', widget.chatTargetId);
    });

    socket.on('new-message', (data) {
      print('Socket received new-message: $data');
      if (mounted && data is Map<String, dynamic>) {
        try {
          final newMessage = ChatMessage.fromJson(data);
          if (!_messages.any((msg) => msg.id == newMessage.id)) {
            setState(() {
              _messages.add(newMessage);
              _messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
            });
            _scrollToBottom();
          } else {
            print(
              "Duplicate message ID received via socket, ignoring: ${newMessage.id}",
            );
          }
        } catch (e) {
          print(
            "Error processing received message via socket: $e, Data: $data",
          );
        }
      }
    });

    // <<< THÊM: Lắng nghe lỗi gửi tin nhắn từ server >>>
    socket.on('send-message-error', (errorData) {
      print('Socket received send-message-error: $errorData');
      if (mounted && errorData is Map<String, dynamic>) {
        final String errorMessage =
            errorData['details'] ??
            errorData['message'] ??
            'Lỗi không xác định từ server.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi gửi tin nhắn: $errorMessage'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    });

    socket.onDisconnect((reason) {
      if (!mounted) return;
      setState(() {
        _isConnected = false;
      });
      print('Socket disconnected for group ${widget.chatTargetId}: $reason');
      if (reason == 'io server disconnect') {
        // socket.connect(); // Cân nhắc việc tự động kết nối lại
      }
    });

    socket.onConnectError((data) {
      if (!mounted) return;
      setState(() {
        _isConnected = false;
      });
      print('Socket connection error for group ${widget.chatTargetId}: $data');
    });

    socket.onError(
      (data) =>
          print('Socket general error for group ${widget.chatTargetId}: $data'),
    );
  }

  Future<void> _loadInitialMessages() async {
    if (widget.chatTargetId.isEmpty) {
      print(
        "Error: chatTargetId is empty in _loadInitialMessages. Cannot load messages.",
      );
      if (mounted) {
        setState(() => _isLoadingMessages = false);
      }
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoadingMessages = true;
    });

    // <<< THÊM: Lấy token >>>
    final String? token = await _authService.getToken();
    if (token == null) {
      print("Error loading messages: No auth token found.");
      if (mounted) {
        _handleApiError("Token not found for loading messages", 401);
      }
      setState(() => _isLoadingMessages = false);
      return;
    }

    final url = Uri.parse(
      '$_chatServiceBaseUrl/api/groups/${widget.chatTargetId}/messages',
    );
    print("Loading initial messages from: $url");

    try {
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
        final List<dynamic> messagesJson = jsonDecode(response.body);
        setState(() {
          _messages.clear();
          _messages.addAll(
            messagesJson
                .map(
                  (json) => ChatMessage.fromJson(json as Map<String, dynamic>),
                )
                .toList(),
          );
          _messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
        });
        print("Loaded ${_messages.length} initial messages.");
        _scrollToBottom(instant: true);
      } else {
        _handleApiError(response.body, response.statusCode);
      }
    } catch (e) {
      _handleApiError(e, null);
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMessages = false;
        });
      }
    }
  }

  void _sendMessage() {
    if (widget.chatTargetId.isEmpty) {
      print(
        "Error: chatTargetId is empty in _sendMessage. Cannot send message.",
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lỗi: Không thể gửi tin nhắn do thiếu ID nhóm.'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    if (!_isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Chưa kết nối tới máy chủ chat. Vui lòng thử lại.'),
          backgroundColor: Colors.orange,
        ),
      );
      if (!socket.connected) {
        print("Attempting to reconnect socket before sending message...");
        socket.connect();
      }
      return;
    }

    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final messageData = {
      'group_id': widget.chatTargetId,
      'sender_id': widget.currentUser.docId,
      'sender_name': widget.currentUser.fullName,
      'text': text,
    };

    print("Emitting send-message via socket: $messageData");
    socket.emit('send-message', messageData);
    _messageController.clear();
  }

  void _scrollToBottom({bool instant = false}) {
    if (_messages.isEmpty || !_scrollController.hasClients) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        final maxScroll = _scrollController.position.maxScrollExtent;
        if (instant) {
          _scrollController.jumpTo(maxScroll);
        } else {
          _scrollController.animateTo(
            maxScroll,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      }
    });
  }

  // <<< TẠO HÀM MỚI ĐỂ FETCH DỮ LIỆU THÀNH VIÊN >>>
  Future<List<Map<String, String>>> _fetchGroupMembersData(
    String groupId,
  ) async {
    final String? token = await _authService.getToken();
    if (token == null) {
      // Xử lý lỗi token ở đây, có thể throw Exception để FutureBuilder bắt
      // Hoặc gọi _handleApiError và trả về list rỗng/throw lỗi
      // Quan trọng: _handleApiError cần context, nếu gọi từ đây, nó sẽ là context của ChatScreen
      // Nếu muốn hiển thị lỗi trong dialog, FutureBuilder sẽ xử lý
      print("Error fetching group members: No auth token found.");
      // Không gọi _handleApiError trực tiếp ở đây nếu muốn FutureBuilder xử lý lỗi UI
      throw Exception('Token không hợp lệ. Vui lòng đăng nhập lại.');
    }

    final memberIdsUrl = Uri.parse(
      '$_chatServiceBaseUrl/api/groups/$groupId/members',
    );
    print("Fetching member IDs from: $memberIdsUrl");
    final memberIdsResponse = await http.get(
      memberIdsUrl,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (memberIdsResponse.statusCode != 200) {
      print(
        'Lỗi tải ID thành viên: ${memberIdsResponse.statusCode} - ${memberIdsResponse.body}',
      );
      throw Exception(
        'Lỗi tải danh sách ID thành viên: ${memberIdsResponse.statusCode}',
      );
    }

    final List<dynamic> idsJson = jsonDecode(memberIdsResponse.body);
    final List<String> memberIds = idsJson.map((id) => id.toString()).toList();
    print("Fetched member IDs: $memberIds");

    List<Map<String, String>> fetchedMembersTemp = [];
    for (String userIdInGroup in memberIds) {
      final userUrl = Uri.parse(
        '$_userServiceBaseUrl/api/auth/user/$userIdInGroup',
      );
      print("Fetching user details for $userIdInGroup from $userUrl");

      final userResponse = await http.get(
        userUrl,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (userResponse.statusCode == 200) {
        final userJson = jsonDecode(userResponse.body);
        String name = 'Unknown User';
        String id = userIdInGroup;

        if (userJson['user'] != null && userJson['user'] is Map) {
          final userData = userJson['user'] as Map<String, dynamic>;
          name = userData['fullName']?.toString() ?? 'User';
          id =
              userData['uid']?.toString() ??
              userData['docId']?.toString() ??
              userIdInGroup;
        } else {
          // Fallback nếu cấu trúc user không như mong đợi
          print(
            "Warning: User data from API for $userIdInGroup is not in the expected format { user: {...} }. Data: $userJson",
          );
          name =
              userJson['fullName']?.toString() ??
              userJson['email']?.toString() ??
              'User $userIdInGroup';
          id =
              userJson['uid']?.toString() ??
              userJson['docId']?.toString() ??
              userIdInGroup;
        }
        fetchedMembersTemp.add({'id': id, 'name': name});
      } else {
        print(
          'Lỗi tải thông tin user $userIdInGroup: ${userResponse.statusCode} - ${userResponse.body}',
        );
        // Vẫn thêm vào list để người dùng biết có lỗi với user cụ thể
        fetchedMembersTemp.add({
          'id': userIdInGroup,
          'name': 'User $userIdInGroup (Lỗi tải)',
        });
      }
    }
    return fetchedMembersTemp;
  }

  // <<< SỬA ĐỔI HÀM HIỂN THỊ DIALOG ĐỂ DÙNG FutureBuilder >>>
  void _showGroupMembersDialog(BuildContext context) {
    final String groupId = widget.chatTargetId;
    final String groupName = widget.chatTargetName;

    showDialog<void>(
      context: context,
      // barrierDismissible: true, // Cho phép đóng khi đang tải nếu muốn
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: Text('Thành viên nhóm "$groupName"'),
          content: SizedBox(
            width: double.maxFinite,
            height: MediaQuery.of(context).size.height * 0.4,
            child: FutureBuilder<List<Map<String, String>>>(
              future: _fetchGroupMembersData(groupId), // Gọi hàm fetch dữ liệu
              builder: (
                BuildContext context,
                AsyncSnapshot<List<Map<String, String>>> snapshot,
              ) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  // Xử lý lỗi token đặc biệt nếu cần
                  if (snapshot.error.toString().contains(
                    'Token không hợp lệ',
                  )) {
                    // Gọi _handleApiError để xử lý logout, truyền dialogContext
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _handleApiError(
                        snapshot.error,
                        401,
                        dialogContext: dialogContext,
                      );
                    });
                    return Center(
                      child: Text(
                        'Phiên đăng nhập hết hạn. Đang điều hướng...',
                      ),
                    );
                  }
                  return Center(
                    child: Text('Lỗi tải dữ liệu: ${snapshot.error}'),
                  );
                } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                  final membersList = snapshot.data!;
                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: membersList.length,
                    itemBuilder: (ctx, index) {
                      final member = membersList[index];
                      final isCurrentUser =
                          member['id'] == widget.currentUser.docId;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor:
                              isCurrentUser
                                  ? Theme.of(context).primaryColorLight
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
                  );
                } else {
                  return const Center(
                    child: Text('Không có thành viên nào trong nhóm này.'),
                  );
                }
              },
            ),
          ),
          actions: <Widget>[
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
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final isUserMessage = message.senderId == widget.currentUser.docId;
    return Align(
      alignment: isUserMessage ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        margin: const EdgeInsets.symmetric(vertical: 5.0, horizontal: 8.0),
        padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 10.0),
        decoration: BoxDecoration(
          color: isUserMessage ? Colors.blueAccent[100] : Colors.grey[200],
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18.0),
            topRight: const Radius.circular(18.0),
            bottomLeft: Radius.circular(isUserMessage ? 18.0 : 3.0),
            bottomRight: Radius.circular(isUserMessage ? 3.0 : 18.0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              spreadRadius: 1,
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isUserMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isUserMessage)
              Padding(
                padding: const EdgeInsets.only(bottom: 3.0),
                child: Text(
                  message.senderName,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.0,
                    color: Colors.blueGrey[700],
                  ),
                ),
              ),
            Text(
              message.text,
              style: const TextStyle(
                fontSize: 15.5,
                color: Colors.black87,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 5.0),
            Text(
              DateFormat('HH:mm').format(message.timestamp),
              style: TextStyle(fontSize: 11.0, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            offset: const Offset(0, -2),
            blurRadius: 5.0,
            color: Colors.black.withOpacity(0.08),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(25.0),
                ),
                child: TextField(
                  controller: _messageController,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: 'Nhập tin nhắn...',
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20.0,
                      vertical: 14.0,
                    ),
                  ),
                  minLines: 1,
                  maxLines: 5,
                  enabled: _isConnected,
                  textInputAction: TextInputAction.send,
                  onSubmitted: _isConnected ? (_) => _sendMessage() : null,
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: _isConnected ? _sendMessage : null,
              color:
                  _isConnected ? Theme.of(context).primaryColor : Colors.grey,
              iconSize: 28,
              tooltip: 'Gửi',
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.chatTargetName),
        backgroundColor: Colors.blueAccent,
        elevation: 1.0,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            tooltip: 'Xem thành viên nhóm',
            onPressed: () {
              if (widget.chatTargetId.isNotEmpty) {
                _showGroupMembersDialog(context); // <<< SỬA: Gọi hàm mới
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Lỗi: Không có ID nhóm để xem thành viên.'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child:
                _isLoadingMessages
                    ? const Center(child: CircularProgressIndicator())
                    : (_messages.isEmpty
                        ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Text(
                              widget.chatTargetId.isEmpty
                                  ? 'Lỗi: Không thể tải tin nhắn do thiếu ID nhóm.'
                                  : 'Chưa có tin nhắn nào trong nhóm "${widget.chatTargetName}".\nHãy là người đầu tiên gửi tin nhắn!',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 16.0,
                                color:
                                    widget.chatTargetId.isEmpty
                                        ? Colors.red
                                        : Colors.grey[600],
                                height: 1.5,
                              ),
                            ),
                          ),
                        )
                        : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(vertical: 10.0),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            return _buildMessageBubble(_messages[index]);
                          },
                        )),
          ),
          if (!_isConnected &&
              !_isLoadingMessages &&
              widget.chatTargetId.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              color: Colors.orange[100],
              child: const Center(
                child: Text(
                  'Đang kết nối lại với máy chủ chat...',
                  style: TextStyle(color: Colors.deepOrange),
                ),
              ),
            ),
          _buildInputArea(),
        ],
      ),
    );
  }
}
