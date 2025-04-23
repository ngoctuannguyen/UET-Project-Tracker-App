import 'package:flutter/material.dart';
import 'dart:async'; // Để dùng Timer giả lập tin nhắn

// Định nghĩa cấu trúc tin nhắn (có thể mở rộng thêm userId, timestamp,...)
class ChatMessage {
  final String
  senderId; // ID của người gửi ('user' cho người dùng hiện tại, hoặc ID khác)
  final String senderName; // Tên người gửi (quan trọng cho group chat)
  final String text;
  final DateTime timestamp;

  ChatMessage({
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
  });
}

class ChatScreen extends StatefulWidget {
  final String chatTargetId; // ID của người nhận hoặc nhóm chat
  final String chatTargetName; // Tên người nhận hoặc nhóm chat
  final bool isGroupChat; // Cờ xác định đây là chat nhóm hay không

  const ChatScreen({
    Key? key,
    required this.chatTargetId,
    required this.chatTargetName,
    this.isGroupChat = false,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = []; // Danh sách tin nhắn
  final String _currentUserId =
      'user'; // ID người dùng hiện tại (cần thay bằng ID thực tế)
  final String _currentUserName = 'Bạn'; // Tên người dùng hiện tại

  @override
  void initState() {
    super.initState();
    // Tải tin nhắn cũ (giả lập)
    _loadInitialMessages();
    // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc bàn phím hiện lên
    // (Cần xử lý phức tạp hơn nếu muốn giữ vị trí cuộn)
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // Giả lập tải tin nhắn ban đầu
  void _loadInitialMessages() {
    // TODO: Thay thế bằng logic gọi API lấy lịch sử chat dựa trên widget.chatTargetId
    setState(() {
      _messages.addAll([
        ChatMessage(
          senderId: widget.isGroupChat ? 'Alice' : widget.chatTargetId,
          senderName: widget.isGroupChat ? 'Alice' : widget.chatTargetName,
          text: 'Chào bạn!',
          timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
        ),
        ChatMessage(
          senderId: _currentUserId,
          senderName: _currentUserName,
          text: 'Chào!',
          timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
        ),
        if (widget.isGroupChat)
          ChatMessage(
            senderId: 'Bob',
            senderName: 'Bob',
            text: 'Mọi người thấy sao về đề xuất mới?',
            timestamp: DateTime.now().subtract(const Duration(minutes: 3)),
          ),
        ChatMessage(
          senderId: widget.isGroupChat ? 'Alice' : widget.chatTargetId,
          senderName: widget.isGroupChat ? 'Alice' : widget.chatTargetName,
          text: 'Rất hay đó!',
          timestamp: DateTime.now().subtract(const Duration(minutes: 2)),
        ),
      ]);
    });
    _scrollToBottom();
  }

  // Hàm gửi tin nhắn
  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final newMessage = ChatMessage(
      senderId: _currentUserId,
      senderName: _currentUserName, // Tên của người dùng hiện tại
      text: text,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(newMessage);
    });

    _messageController.clear();
    _scrollToBottom(); // Cuộn xuống khi gửi

    // TODO: Gửi tin nhắn lên server (API call)
    print('Gửi tin nhắn: "$text" đến ${widget.chatTargetId}');

    // Giả lập tin nhắn trả lời (cho demo)
    if (!widget.isGroupChat) {
      Timer(const Duration(seconds: 1), () {
        if (mounted) {
          // Kiểm tra widget còn tồn tại không
          final replyMessage = ChatMessage(
            senderId: widget.chatTargetId,
            senderName: widget.chatTargetName,
            text: 'Đã nhận: "$text"',
            timestamp: DateTime.now(),
          );
          setState(() {
            _messages.add(replyMessage);
          });
          _scrollToBottom();
        }
      });
    } else {
      // Trong group chat, tin nhắn mới sẽ được push từ server (không cần giả lập trả lời)
    }
  }

  // Hàm cuộn xuống cuối danh sách tin nhắn
  void _scrollToBottom() {
    // Đảm bảo việc cuộn xảy ra sau khi frame đã được build xong
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Widget hiển thị một bong bóng tin nhắn
  Widget _buildMessageBubble(ChatMessage message) {
    final isUserMessage = message.senderId == _currentUserId;
    final alignment =
        isUserMessage ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = isUserMessage ? Colors.blue[400] : Colors.grey[300];
    final textColor = isUserMessage ? Colors.white : Colors.black87;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4.0),
      child: Column(
        crossAxisAlignment: alignment,
        children: [
          // Hiển thị tên người gửi trong group chat (nếu không phải người dùng hiện tại)
          if (widget.isGroupChat && !isUserMessage)
            Padding(
              padding: const EdgeInsets.only(
                left: 15.0,
                right: 15.0,
                bottom: 2.0,
              ),
              child: Text(
                message.senderName,
                style: const TextStyle(fontSize: 12.0, color: Colors.grey),
              ),
            ),
          // Bong bóng tin nhắn
          Row(
            mainAxisAlignment:
                isUserMessage ? MainAxisAlignment.end : MainAxisAlignment.start,
            children: [
              ConstrainedBox(
                // Giới hạn chiều rộng của bong bóng
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
                    borderRadius: BorderRadius.circular(15.0),
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(color: textColor, fontSize: 16.0),
                  ),
                ),
              ),
            ],
          ),
          // Hiển thị thời gian (có thể thêm vào dưới bong bóng)
          // Padding(
          //   padding: const EdgeInsets.only(top: 2.0, left: 15.0, right: 15.0),
          //   child: Text(
          //     DateFormat('HH:mm').format(message.timestamp), // Cần import 'package:intl/intl.dart';
          //     style: TextStyle(fontSize: 10.0, color: Colors.grey),
          //   ),
          // ),
        ],
      ),
    );
  }

  // Widget khu vực nhập liệu
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
        // Đảm bảo không bị che bởi notch hoặc bottom bar hệ thống
        child: Row(
          children: [
            // Có thể thêm nút đính kèm file ở đây
            // IconButton(
            //   icon: Icon(Icons.attach_file),
            //   onPressed: () {},
            // ),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14.0),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(25.0),
                ),
                child: TextField(
                  controller: _messageController,
                  decoration: const InputDecoration(
                    hintText: 'Nhập tin nhắn...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      vertical: 10.0,
                    ), // Điều chỉnh padding dọc
                  ),
                  textCapitalization: TextCapitalization.sentences,
                  minLines: 1,
                  maxLines: 5, // Cho phép nhập nhiều dòng
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            // Nút gửi
            FloatingActionButton(
              mini: true, // Kích thước nhỏ hơn
              onPressed: _sendMessage,
              child: const Icon(Icons.send),
              backgroundColor: Colors.blueAccent,
              elevation: 1.0,
            ),
          ],
        ),
      ),
    );
  }

  // Hàm hiển thị thông tin nhóm (ví dụ)
  void _showGroupInfo() {
    // Bạn có thể dùng lại dialog _showGroupMembers từ friends_list_screen
    // hoặc tạo một dialog/màn hình mới hiển thị chi tiết hơn
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text('Nhóm "${widget.chatTargetName}"'),
            content: const Text(
              'Đây là nơi hiển thị danh sách thành viên và các tùy chọn khác của nhóm.',
            ), // Placeholder
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Đóng'),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.chatTargetName), // Hiển thị tên người/nhóm chat
        backgroundColor: Colors.blueAccent,
        elevation: 1.0, // Giảm shadow
        actions: [
          // Hiển thị nút thông tin nếu là group chat
          if (widget.isGroupChat)
            IconButton(
              icon: const Icon(Icons.info_outline),
              tooltip: 'Thông tin nhóm',
              onPressed: _showGroupInfo,
            ),
          // Có thể thêm các nút khác như gọi video/audio
          // IconButton(
          //   icon: Icon(Icons.videocam_outlined),
          //   onPressed: () {},
          // ),
        ],
      ),
      body: Column(
        children: [
          // Phần hiển thị tin nhắn
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              reverse:
                  false, // Hiển thị từ trên xuống dưới, tin mới nhất ở cuối
              padding: const EdgeInsets.symmetric(
                vertical: 10.0,
                horizontal: 8.0,
              ),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageBubble(message);
              },
            ),
          ),
          // Phần nhập liệu
          _buildInputArea(),
        ],
      ),
      // Không cần BottomNavigationBar ở đây vì nó được push lên trên stack
    );
  }
}
