import 'package:flutter/material.dart';
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel
import 'package:intl/intl.dart'; // <<< THÊM: Import intl để định dạng thời gian

// Định nghĩa cấu trúc tin nhắn
class ChatMessage {
  final String senderId;
  final String senderName;
  final String text;
  final DateTime timestamp;

  ChatMessage({
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    DateTime parsedTimestamp;
    try {
      if (json['timestamp'] is Map) {
        // Firestore Timestamp
        parsedTimestamp = DateTime.fromMillisecondsSinceEpoch(
          (json['timestamp']['_seconds'] * 1000 +
                  json['timestamp']['_nanoseconds'] / 1000000)
              .toInt(),
        );
      } else if (json['timestamp'] is String) {
        // ISO 8601 String
        parsedTimestamp =
            DateTime.parse(
              json['timestamp'],
            ).toLocal(); // Chuyển sang giờ địa phương
      } else {
        // Fallback
        parsedTimestamp = DateTime.now();
      }
    } catch (e) {
      print("Error parsing timestamp: ${json['timestamp']} - $e");
      parsedTimestamp = DateTime.now(); // Fallback nếu parse lỗi
    }

    return ChatMessage(
      senderId: json['sender_id']?.toString() ?? 'unknown_sender',
      senderName: json['sender_name']?.toString() ?? 'Unknown User',
      text: json['text']?.toString() ?? '',
      timestamp: parsedTimestamp,
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String chatTargetId; // ID của nhóm chat
  final String chatTargetName; // Tên nhóm chat
  final UserModel currentUser; // <<< THÊM: Người dùng hiện tại

  const ChatScreen({
    Key? key,
    required this.chatTargetId,
    required this.chatTargetName,
    required this.currentUser, // <<< THÊM: Yêu cầu currentUser
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];

  late IO.Socket socket;
  List<Map<String, String>> _groupMembers = [];
  bool _isLoadingMembers = false;
  bool _isLoadingMessages = false;

  // --- !!! QUAN TRỌNG: Thay đổi URL backend nếu cần !!! ---
  // Sử dụng IP cục bộ nếu test trên điện thoại thật, ví dụ: 'http://192.168.1.7:3000'
  final String backendUrl = 'http://localhost:3000';
  // ---

  @override
  void initState() {
    super.initState();
    print(
      'ChatScreen initState for group ${widget.chatTargetId}, user: ${widget.currentUser.fullName}',
    );
    _connectSocket();
    _loadInitialMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    socket.dispose();
    super.dispose();
  }

  void _connectSocket() {
    socket = IO.io(backendUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket.onConnect((_) {
      print('Socket connected: ${socket.id}');
      socket.emit('join-group', widget.chatTargetId);
    });

    socket.on('new-message', (data) {
      print('Received new message: $data');
      if (mounted && data is Map<String, dynamic>) {
        try {
          final newMessage = ChatMessage.fromJson(data);
          // Kiểm tra trùng lặp chặt chẽ hơn (nếu server trả về ID tin nhắn)
          // if (!_messages.any((msg) => msg.id == newMessage.id)) {
          if (!_messages.any(
            (msg) =>
                msg.text == newMessage.text &&
                msg.senderId == newMessage.senderId &&
                msg.timestamp.difference(newMessage.timestamp).inSeconds.abs() <
                    2,
          )) {
            setState(() {
              _messages.add(newMessage);
              _messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
            });
            _scrollToBottom();
          }
        } catch (e) {
          print("Error processing received message: $e");
        }
      }
    });

    socket.onDisconnect((_) => print('Socket disconnected'));
    socket.onConnectError((data) => print('Socket connection error: $data'));
    socket.onError((data) => print('Socket error: $data'));
  }

  Future<void> _loadInitialMessages() async {
    if (!mounted) return;
    setState(() {
      _isLoadingMessages = true;
    });
    final url = Uri.parse(
      '$backendUrl/api/groups/${widget.chatTargetId}/messages',
    );
    try {
      final response = await http.get(url);
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
        _scrollToBottom(instant: true);
      } else {
        print('Failed to load messages: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải tin nhắn: ${response.statusCode}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Error loading messages: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải tin nhắn: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMessages = false;
        });
      }
    }
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    // <<< SỬA: Sử dụng thông tin từ widget.currentUser >>>
    final messageData = {
      'group_id': widget.chatTargetId,
      'sender_id': widget.currentUser.docId, // Sử dụng docId từ UserModel
      'sender_name':
          widget.currentUser.fullName, // Sử dụng fullName từ UserModel
      'text': text,
    };

    socket.emit('send-message', messageData);
    _messageController.clear();
    // Không cần cuộn ở đây, chờ tin nhắn mới từ server
  }

  void _scrollToBottom({bool instant = false}) {
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

  Widget _buildMessageBubble(ChatMessage message) {
    // <<< SỬA: Sử dụng widget.currentUser.docId để so sánh >>>
    final isUserMessage = message.senderId == widget.currentUser.docId;
    final alignment =
        isUserMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final bubbleAlignment =
        isUserMessage ? MainAxisAlignment.end : MainAxisAlignment.start;
    final color = isUserMessage ? Colors.blueAccent[100] : Colors.grey[200];
    final textColor = Colors.black87; // Giữ màu đen cho dễ đọc
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(15.0),
      topRight: const Radius.circular(15.0),
      bottomLeft: Radius.circular(isUserMessage ? 15.0 : 0),
      bottomRight: Radius.circular(isUserMessage ? 0 : 15.0),
    );

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
      child: Column(
        crossAxisAlignment: alignment,
        children: [
          if (!isUserMessage)
            Padding(
              padding: const EdgeInsets.only(left: 10.0, bottom: 2.0),
              child: Text(
                message.senderName,
                style: const TextStyle(fontSize: 12.0, color: Colors.grey),
              ),
            ),
          Row(
            mainAxisAlignment: bubbleAlignment,
            children: [
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: MediaQuery.of(context).size.width * 0.75,
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14.0,
                    vertical: 10.0,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: borderRadius,
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(color: textColor, fontSize: 16.0),
                  ),
                ),
              ),
            ],
          ),
          // Hiển thị thời gian dưới bong bóng
          Padding(
            padding: EdgeInsets.only(
              top: 3.0,
              left: isUserMessage ? 0 : 10.0,
              right: isUserMessage ? 10.0 : 0,
            ),
            child: Text(
              DateFormat('HH:mm').format(message.timestamp), // Định dạng HH:mm
              style: const TextStyle(fontSize: 10.0, color: Colors.grey),
            ),
          ),
        ],
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
            offset: const Offset(0, -1),
            blurRadius: 3.0,
            color: Colors.black.withOpacity(0.05),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14.0),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(25.0),
                ),
                child: TextField(
                  controller: _messageController,
                  decoration: const InputDecoration(
                    hintText: 'Nhập tin nhắn...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 10.0),
                  ),
                  textCapitalization: TextCapitalization.sentences,
                  minLines: 1,
                  maxLines: 5,
                  onSubmitted: (_) => _sendMessage(),
                  textInputAction: TextInputAction.send,
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            FloatingActionButton(
              mini: true,
              onPressed: _sendMessage,
              child: const Icon(Icons.send),
              backgroundColor: Colors.blueAccent,
              elevation: 1.0,
              tooltip: 'Gửi',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _fetchAndShowGroupMembers() async {
    if (!mounted) return;
    setState(() {
      _isLoadingMembers = true;
    });
    final url = Uri.parse(
      '$backendUrl/api/groups/${widget.chatTargetId}/members',
    );
    try {
      final response = await http.get(url);
      if (!mounted) return;

      if (response.statusCode == 200) {
        final List<dynamic> membersJson = jsonDecode(response.body);
        setState(() {
          // Giả sử backend trả về list các object có 'id' và 'name'
          _groupMembers =
              membersJson.map((memberData) {
                if (memberData is Map<String, dynamic>) {
                  return {
                    'id': memberData['id']?.toString() ?? 'unknown_id',
                    'name': memberData['name']?.toString() ?? 'Unknown User',
                  };
                }
                return {'id': 'invalid_data', 'name': 'Invalid Data'};
              }).toList();
        });
        _showGroupMembersDialog();
      } else {
        print('Failed to load members: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Lỗi tải danh sách thành viên: ${response.statusCode}',
            ),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      print('Error loading members: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải danh sách thành viên: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMembers = false;
        });
      }
    }
  }

  void _showGroupMembersDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text('Thành viên nhóm "${widget.chatTargetName}"'),
            content:
                _groupMembers.isEmpty
                    ? const Text('Không tìm thấy thành viên nào.')
                    : SizedBox(
                      width: double.maxFinite,
                      height: MediaQuery.of(context).size.height * 0.4,
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _groupMembers.length,
                        itemBuilder: (context, index) {
                          final member = _groupMembers[index];
                          final memberName = member['name'] ?? 'Unknown User';
                          final memberInitial =
                              memberName.isNotEmpty
                                  ? memberName[0].toUpperCase()
                                  : '?';
                          return ListTile(
                            leading: CircleAvatar(
                              child: Text(memberInitial),
                              backgroundColor: Colors.grey[300],
                            ),
                            title: Text(memberName),
                            // subtitle: Text('ID: ${member['id']}'), // Ẩn ID nếu không cần thiết
                          );
                        },
                      ),
                    ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Đóng'),
              ),
            ],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15.0),
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
          _isLoadingMembers
              ? const Padding(
                padding: EdgeInsets.only(right: 15.0),
                child: Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                ),
              )
              : IconButton(
                icon: const Icon(Icons.info_outline),
                tooltip: 'Thông tin nhóm',
                onPressed: _fetchAndShowGroupMembers,
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
                        ? const Center(
                          child: Text(
                            'Bắt đầu cuộc trò chuyện!',
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                          ),
                        )
                        : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(vertical: 10.0),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final message = _messages[index];
                            return _buildMessageBubble(message);
                          },
                        )),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }
}
