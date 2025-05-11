import 'package:flutter/material.dart';
import 'dart:async'; // Import để sử dụng Future.delayed

// Màn hình để viết và gửi báo cáo
class ReportScreen extends StatefulWidget {
  final String imagePath; // Nhận đường dẫn ảnh từ màn hình trước

  const ReportScreen({Key? key, required this.imagePath}) : super(key: key);

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final TextEditingController _reportContentController =
      TextEditingController();
  bool _isLoading = false; // Trạng thái loading khi gửi
  bool _isSuccess = false; // Trạng thái gửi thành công

  @override
  void dispose() {
    _reportContentController.dispose();
    super.dispose();
  }

  // Hàm xử lý gửi báo cáo (mô phỏng)
  Future<void> _sendReport() async {
    if (_reportContentController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập nội dung báo cáo.')),
      );
      return;
    }

    setState(() {
      _isLoading = true; // Bắt đầu loading
      _isSuccess = false; // Reset trạng thái success nếu gửi lại
    });

    // Mô phỏng việc gửi dữ liệu lên server
    try {
      // Lấy nội dung báo cáo và đường dẫn ảnh
      final reportContent = _reportContentController.text;
      final imagePath = widget.imagePath;
      print('--- Gửi Báo Cáo ---');
      print('Nội dung: $reportContent');
      print('Ảnh: $imagePath');
      print('--------------------');

      // Giả lập độ trễ mạng
      await Future.delayed(const Duration(seconds: 2));

      // Giả lập thành công
      setState(() {
        _isLoading = false; // Kết thúc loading
        _isSuccess = true; // Đánh dấu thành công
      });

      // Hiển thị thông báo thành công và có thể tự động quay lại sau vài giây
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Gửi báo cáo thành công!'),
          backgroundColor: Colors.green,
        ),
      );
      // Tùy chọn: Tự động quay lại màn hình trước sau khi thành công
      // Timer(const Duration(seconds: 2), () {
      //   if (mounted) {
      //     Navigator.pop(context); // Quay lại ImageSearchResultScreen
      //   }
      // });
    } catch (error) {
      // Xử lý lỗi nếu có
      print("Lỗi khi gửi báo cáo: $error");
      setState(() {
        _isLoading = false; // Kết thúc loading khi có lỗi
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gửi báo cáo thất bại: $error'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Placeholder tên quản lý
    const String managerName = "Nguyễn Văn A";

    return Scaffold(
      appBar: AppBar(
        title: const Text('Viết Báo Cáo'),
        backgroundColor: Colors.blueAccent, // Hoặc màu gradient
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Chỉ cho phép quay lại nếu không đang loading
            if (!_isLoading) {
              Navigator.pop(context); // Quay lại ImageSearchResultScreen
            }
          },
        ),
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
          // Thêm gradient nếu muốn
          gradient: LinearGradient(
            colors: [
              Colors.lightBlue[50] ?? Colors.white,
              Colors.lightBlue[100] ?? Colors.lightBlue,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          // Cho phép cuộn nếu nội dung dài
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Thông tin người quản lý và chỉ báo trạng thái
              const Text(
                'Người quản lý:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12.0),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.3),
                      spreadRadius: 1,
                      blurRadius: 3,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Tên quản lý
                    const Text(
                      managerName,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    // Chỉ báo Loading hoặc Success
                    if (_isLoading)
                      const SizedBox(
                        width: 24, // Kích thước cố định cho indicator
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 3),
                      )
                    else if (_isSuccess)
                      const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 28,
                      )
                    else
                      const SizedBox(
                        width: 24,
                        height: 24,
                      ), // Placeholder giữ chỗ
                  ],
                ),
              ),
              const SizedBox(height: 25),

              // 2. Khung nhập nội dung báo cáo
              const Text(
                'Nội dung báo cáo:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _reportContentController,
                maxLines: 8, // Cho phép nhập nhiều dòng
                minLines: 5,
                enabled:
                    !_isLoading &&
                    !_isSuccess, // Vô hiệu hóa khi đang gửi hoặc đã thành công
                decoration: InputDecoration(
                  hintText: 'Nhập chi tiết báo cáo của bạn...',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey[400]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(
                      color: Theme.of(context).primaryColor,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                ),
              ),
              const SizedBox(height: 30),

              // 3. Nút Gửi báo cáo
              Center(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.send, color: Colors.white),
                  label: Text(
                    _isLoading
                        ? 'Đang gửi...'
                        : (_isSuccess ? 'Đã gửi' : 'Gửi báo cáo'),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // Vô hiệu hóa nút khi đang loading hoặc đã gửi thành công
                  onPressed: (_isLoading || _isSuccess) ? null : _sendReport,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _isSuccess ? Colors.green : Colors.blueAccent[400],
                    padding: const EdgeInsets.symmetric(
                      horizontal: 50,
                      vertical: 15,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    elevation: 5,
                    // Kiểu dáng khi nút bị vô hiệu hóa
                    disabledBackgroundColor: Colors.grey[400],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      // Không cần BottomNavigationBar ở màn hình này nếu chỉ để báo cáo
    );
  }
}
