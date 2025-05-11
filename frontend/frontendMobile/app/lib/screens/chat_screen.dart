import 'package:flutter/material.dart';
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:app/models/user_model.dart'; // Đảm bảo bạn đã import UserModel
import 'package:intl/intl.dart'; // For date formatting

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
  late IO.Socket socket; // Sẽ được khởi tạo trong initState
  bool _isLoadingMessages = true;
  bool _isConnected = false;

  // --- Configuration ---
  static const String _chatServiceBaseUrl =
      'http://localhost:3002'; // PORT của chat-service
  // ---

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
          _isLoadingMessages = false; // Dừng loading
        });
        // Hiển thị thông báo lỗi và có thể tự động đóng màn hình
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lỗi: Không thể mở phòng chat do thiếu ID nhóm.'),
                backgroundColor: Colors.red,
              ),
            );
            Navigator.of(context).pop(); // Quay lại màn hình trước
          }
        });
      }
      return; // Không thực hiện kết nối nếu ID nhóm rỗng
    }

    _connectSocket();
    _loadInitialMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    print("Disposing socket for group ${widget.chatTargetId}");

    // Kiểm tra xem socket đã được khởi tạo chưa (quan trọng nếu initState return sớm)
    // Sử dụng 'this::socket.isInitialized' để kiểm tra biến 'late' đã được gán chưa.
    // Tuy nhiên, cách tiếp cận an toàn hơn là dùng một cờ boolean hoặc kiểm tra null nếu không dùng 'late'.
    // Vì 'socket' là 'late', nếu initState return sớm, nó sẽ không được gán.
    // Một cách đơn giản là kiểm tra xem _connectSocket đã được gọi chưa, hoặc dùng try-catch.
    // Hoặc, nếu bạn chắc chắn _connectSocket luôn được gọi nếu chatTargetId không rỗng:
    try {
      // Gỡ bỏ tất cả các listeners đã đăng ký
      socket.off('connect');
      socket.off('new-message');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      // Thêm bất kỳ listeners nào khác bạn đã đăng ký ở đây

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

  void _connectSocket() {
    // Khởi tạo socket ở đây
    socket = IO.io(_chatServiceBaseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false, // Kết nối thủ công
    });

    socket.connect(); // Thực hiện kết nối

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
          // Kiểm tra trùng lặp tin nhắn dựa trên ID
          if (!_messages.any((msg) => msg.id == newMessage.id)) {
            setState(() {
              _messages.add(newMessage);
              _messages.sort(
                (a, b) => a.timestamp.compareTo(b.timestamp),
              ); // Sắp xếp lại
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

    socket.onDisconnect((reason) {
      if (!mounted) return;
      setState(() {
        _isConnected = false;
      });
      print('Socket disconnected for group ${widget.chatTargetId}: $reason');
      // Tự động kết nối lại nếu server chủ động ngắt
      if (reason == 'io server disconnect') {
        socket.connect();
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

    final url = Uri.parse(
      '$_chatServiceBaseUrl/api/groups/${widget.chatTargetId}/messages',
    );
    print("Loading initial messages from: $url");

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
          _isLoadingMessages = false;
        });
        print("Loaded ${_messages.length} initial messages.");
        _scrollToBottom(instant: true);
      } else {
        print(
          'Failed to load messages: ${response.statusCode} ${response.body}',
        );
        if (mounted) {
          setState(() {
            _isLoadingMessages = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi tải tin nhắn: ${response.statusCode}')),
          );
        }
      }
    } catch (e) {
      print('Error loading messages: $e');
      if (mounted) {
        setState(() {
          _isLoadingMessages = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi kết nối tải tin nhắn: $e')));
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
        socket.connect(); // Thử kết nối lại
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
      // Server sẽ tự tạo timestamp
    };

    print("Emitting send-message via socket: $messageData");
    socket.emit('send-message', messageData);
    _messageController.clear();
    // Tin nhắn sẽ được thêm vào danh sách khi nhận 'new-message' từ server
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
                  enabled: _isConnected, // Chỉ cho phép nhập khi đã kết nối
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
                                  ? 'Lỗi: Không thể tải tin nhắn do thiếu ID nhóm.' // Thông báo nếu ID nhóm rỗng từ đầu
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
              widget.chatTargetId.isNotEmpty) // Chỉ hiển thị nếu ID nhóm hợp lệ
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
