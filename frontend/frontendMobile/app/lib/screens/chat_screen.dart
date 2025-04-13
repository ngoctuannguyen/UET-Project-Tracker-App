import 'package:flutter/material.dart';
import 'dart:math' as math; // Để dùng cho Bubble và xoay icon

// import 'package:app/screens/chatbot_screen.dart';
// Model đơn giản cho tin nhắn (bạn có thể mở rộng thêm)
class ChatMessage {
  final String text;
  final String sender; // 'me' hoặc 'friend'
  final String time;
  final String? audioUrl; // Tùy chọn: đường dẫn file âm thanh
  final Duration? audioDuration; // Tùy chọn: thời lượng âm thanh

  ChatMessage({
    required this.text,
    required this.sender,
    required this.time,
    this.audioUrl,
    this.audioDuration,
  });
}

// Dữ liệu giả lập cho cuộc trò chuyện
final List<ChatMessage> chatMessages = [
  ChatMessage(
    text: 'Hello ! Nazrul How are you?',
    sender: 'friend',
    time: '09:25 AM',
  ),
  ChatMessage(text: 'You did your job well!', sender: 'me', time: '09:25 AM'),
  ChatMessage(
    text: 'Have a great working week!!',
    sender: 'friend',
    time: '09:25 AM',
  ),
  ChatMessage(text: 'Hope you like it', sender: 'friend', time: '09:25 AM'),
  ChatMessage(
    text: '', // Text rỗng cho tin nhắn thoại
    sender: 'me',
    time: '09:25 AM',
    audioUrl: 'fake_audio.mp3', // Đường dẫn giả
    audioDuration: const Duration(seconds: 16),
  ),
];

class ChatScreen extends StatefulWidget {
  final String friendName;
  final String friendAvatarUrl;
  final String friendStatus;

  const ChatScreen({
    Key? key,
    required this.friendName,
    required this.friendAvatarUrl,
    required this.friendStatus,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  // Index của tab hiện tại khi đang ở màn hình chat (có thể là -1 để không tab nào sáng)
  // Hoặc bạn có thể giữ nguyên index của tab đã dẫn đến đây (ví dụ: Nhóm là 1)
  int _selectedIndex = 1; // Giả sử đến từ tab Nhóm

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // Hàm xử lý khi nhấn vào BottomNavigationBar item trên màn hình này
  void _onItemTapped(int index) {
    if (index == 0) {
      // Home
      // Quay về màn hình gốc (HomeScreen)
      Navigator.popUntil(context, (route) => route.isFirst);
    } else if (index == 1) {
      // Nhóm
      // Nếu đang ở ChatScreen (đã push từ FriendsList), pop về FriendsList
      if (Navigator.canPop(context)) {
        // Kiểm tra xem có phải về từ FriendsList không, nếu không thì pushReplacement
        // Cách đơn giản hơn: Cứ pop về màn trước (là FriendsList)
        Navigator.pop(context);
      } else {
        // Trường hợp hy hữu: vào thẳng Chat mà không qua FriendsList
        // Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => FriendsListScreen()));
      }
    } else {
      // Xử lý cho các tab khác (Camera, Chat Bot, Settings)
      // Có thể push các màn hình tương ứng lên trên màn Chat hiện tại
      setState(() {
        _selectedIndex = index;
      });
      print('Chat screen - Selected index: $index');
      // TODO: Điều hướng đến các màn hình khác từ ChatScreen
      // Ví dụ:
      // if (index == 2) {
      //   Navigator.push(context, MaterialPageRoute(builder: (context) => ReportScreen()));
      // }
    }
  }

  void _sendMessage() {
    if (_textController.text.trim().isEmpty) return; // Không gửi tin nhắn rỗng

    setState(() {
      // Thêm tin nhắn mới vào danh sách (hiện chỉ là dữ liệu giả)
      chatMessages.add(
        ChatMessage(
          text: _textController.text.trim(),
          sender: 'me',
          time: TimeOfDay.now().format(context), // Lấy giờ hiện tại
        ),
      );
      _textController.clear(); // Xóa nội dung trong ô nhập liệu

      // Cuộn xuống dưới cùng sau khi gửi
      // Đợi 1 chút để ListView cập nhật rồi mới cuộn
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController
                .position
                .minScrollExtent, // Cuộn xuống dưới cùng (vì reverse=true)
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    });
    print('Sending message: ${_textController.text.trim()}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white, // Nền trắng cho AppBar
        elevation: 1.0, // Bóng mờ nhẹ
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black54),
          onPressed: () => Navigator.pop(context), // Quay lại màn hình trước
        ),
        title: Row(
          children: [
            CircleAvatar(
              backgroundImage: AssetImage(widget.friendAvatarUrl),
              radius: 20,
              // TODO: Thêm chấm trạng thái online
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.friendName,
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  widget.friendStatus,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_outlined, color: Colors.black54),
            onPressed: () {
              // TODO: Thực hiện cuộc gọi thoại
              print('Call button pressed');
            },
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: Colors.black54),
            onPressed: () {
              // TODO: Thực hiện cuộc gọi video
              print('Video call button pressed');
            },
          ),
          const SizedBox(width: 5),
        ],
      ),
      body: Column(
        children: [
          // Phần hiển thị tin nhắn
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              reverse: true, // Hiển thị tin nhắn mới nhất ở dưới cùng
              padding: const EdgeInsets.symmetric(
                vertical: 10.0,
                horizontal: 8.0,
              ),
              itemCount: chatMessages.length,
              itemBuilder: (context, index) {
                // Sắp xếp lại để lấy tin nhắn từ cũ đến mới khi reverse=true
                final message = chatMessages[chatMessages.length - 1 - index];
                return _buildMessageBubble(message);
              },
            ),
          ),
          // Phần nhập liệu
          _buildInputArea(),
        ],
      ),
      // BottomNavigationBar giữ nguyên cấu trúc
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
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: 'Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex, // Index có thể là 1 (Nhóm) hoặc -1
        onTap: _onItemTapped, // Sử dụng hàm điều hướng của màn hình này
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blueAccent[700],
        unselectedItemColor: Colors.grey[600],
        backgroundColor: Colors.white,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
      ),
    );
  }

  // Widget xây dựng bong bóng tin nhắn
  Widget _buildMessageBubble(ChatMessage message) {
    bool isMe = message.sender == 'me';
    bool isAudio = message.audioUrl != null;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
        padding: EdgeInsets.symmetric(
          horizontal: isAudio ? 8.0 : 12.0,
          vertical: isAudio ? 6.0 : 10.0,
        ),
        constraints: BoxConstraints(
          // Giới hạn chiều rộng của bubble
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color:
              isMe
                  ? Colors.teal[300] // Màu xanh cho tin nhắn của tôi
                  : Colors.grey[200], // Màu xám nhạt cho tin nhắn bạn bè
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18.0),
            topRight: const Radius.circular(18.0),
            bottomLeft: isMe ? const Radius.circular(18.0) : Radius.zero,
            bottomRight: isMe ? Radius.zero : const Radius.circular(18.0),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Hiển thị nội dung tin nhắn (Text hoặc Audio Player)
            isAudio
                ? _buildAudioPlayer(message)
                : Text(
                  message.text,
                  style: TextStyle(color: isMe ? Colors.white : Colors.black87),
                ),
            const SizedBox(height: 4.0),
            // Hiển thị thời gian
            Text(
              message.time,
              style: TextStyle(
                fontSize: 10.0,
                color: isMe ? Colors.white70 : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget xây dựng trình phát âm thanh (giả lập)
  Widget _buildAudioPlayer(ChatMessage message) {
    // TODO: Tích hợp thư viện phát âm thanh thực tế (ví dụ: just_audio)
    return Row(
      mainAxisSize: MainAxisSize.min, // Chỉ chiếm không gian cần thiết
      children: [
        IconButton(
          icon: const Icon(Icons.play_arrow, color: Colors.white),
          onPressed: () {
            print('Play audio: ${message.audioUrl}');
            // TODO: Xử lý play/pause audio
          },
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        const SizedBox(width: 8),
        // Phần hiển thị sóng âm (giả lập bằng các đường thẳng)
        Expanded(
          // Cho phép nó chiếm không gian còn lại
          child: LayoutBuilder(
            // Lấy chiều rộng thực tế để vẽ
            builder: (context, constraints) {
              final waveWidth = constraints.maxWidth;
              final barCount =
                  (waveWidth / 4).floor(); // Số lượng thanh sóng âm
              return Row(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: List.generate(barCount, (index) {
                  // Tạo chiều cao ngẫu nhiên cho các thanh
                  final barHeight = (math.Random().nextDouble() * 14) + 2.0;
                  return Container(
                    width: 2.5,
                    height: barHeight,
                    margin: const EdgeInsets.symmetric(horizontal: 0.75),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  );
                }),
              );
            },
          ),
        ),
        const SizedBox(width: 8),
        // Hiển thị thời lượng
        Text(
          // Format thời lượng (ví dụ: 00:16)
          '${message.audioDuration!.inMinutes.toString().padLeft(2, '0')}:${(message.audioDuration!.inSeconds % 60).toString().padLeft(2, '0')}',
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }

  // Widget xây dựng khu vực nhập liệu
  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor, // Màu nền của Card
        boxShadow: [
          BoxShadow(
            offset: const Offset(0, -1),
            blurRadius: 2,
            color: Colors.black.withOpacity(0.05),
          ),
        ],
      ),
      child: SafeArea(
        // Đảm bảo không bị che bởi bàn phím hoặc thanh điều hướng ảo
        child: Row(
          children: [
            // Ô nhập liệu
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 2.0,
                ), // Giảm padding ngang
                decoration: BoxDecoration(
                  color: Colors.grey[100], // Nền xám rất nhạt cho ô nhập
                  borderRadius: BorderRadius.circular(25.0),
                ),
                child: TextField(
                  controller: _textController,
                  decoration: InputDecoration(
                    hintText: 'Make...', // Giống trong hình
                    border: InputBorder.none, // Bỏ viền
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 10.0,
                    ), // Điều chỉnh padding nội dung
                    // TODO: Thêm icon mặt cười, mic nếu cần
                    // prefixIcon: IconButton(icon: Icon(Icons.emoji_emotions_outlined), onPressed: (){}),
                  ),
                  onSubmitted:
                      (value) => _sendMessage(), // Gửi khi nhấn Enter/Return
                  textInputAction:
                      TextInputAction.send, // Đổi nút return thành Send
                  minLines: 1,
                  maxLines: 5, // Cho phép nhập nhiều dòng
                ),
              ),
            ),
            const SizedBox(width: 8.0),
            // Nút đính kèm (tùy chọn)
            IconButton(
              icon: Transform.rotate(
                // Xoay icon giấy
                angle: math.pi / 5,
                child: const Icon(Icons.attachment_outlined),
              ),
              onPressed: () {
                // TODO: Xử lý đính kèm file
                print('Attach file pressed');
              },
              color: Colors.grey[600],
            ),

            // Nút gửi
            Material(
              // Dùng Material để tạo hiệu ứng splash trên nền tròn
              color: Colors.teal[400], // Màu nền nút gửi
              borderRadius: BorderRadius.circular(25.0),
              child: InkWell(
                onTap: _sendMessage,
                borderRadius: BorderRadius.circular(25.0),
                child: const Padding(
                  padding: EdgeInsets.all(12.0),
                  child: Icon(Icons.send, color: Colors.white, size: 20.0),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
