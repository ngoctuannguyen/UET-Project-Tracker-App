import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io'; // Import dart:io for File
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:app/models/user_model.dart'; // Import UserModel

class ReportScreen extends StatefulWidget {
  final String? imagePath; // <<< THAY ĐỔI: imagePath thành nullable
  final UserModel? currentUser;
  final String? scannedComponentCode;

  const ReportScreen({
    Key? key,
    this.imagePath, // <<< THAY ĐỔI: không còn required, hoặc giữ required và truyền giá trị
    this.currentUser,
    this.scannedComponentCode,
  }) : super(key: key);

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final TextEditingController _reportContentController =
      TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;
  Map<String, dynamic>? _componentDetails; // Thêm biến để lưu trữ thông tin

  static final String _reportServiceBaseUrl =
      kIsWeb ? 'http://localhost:3004' : 'http://10.0.2.2:3004';

  @override
  void initState() {
    super.initState();
    print(
      "ReportScreen initState: currentUser is ${widget.currentUser?.fullName}",
    );
    print(
      "ReportScreen initState: scannedComponentCode is ${widget.scannedComponentCode}",
    );
  }

  @override
  void dispose() {
    _reportContentController.dispose();
    super.dispose();
  }

  Future<void> _sendReport() async {
    if (_reportContentController.text.trim().isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập nội dung báo cáo.')),
      );
      return;
    }

    if (widget.scannedComponentCode == null ||
        widget.scannedComponentCode!.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không có mã component để gửi báo cáo.')),
      );
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _isSuccess = false;
    });

    try {
      final reportContent = _reportContentController.text;
      // Lấy employeeId từ currentUser.userId. Backend sẽ dùng default nếu null/undefined.
      // Đảm bảo kiểu dữ liệu của employeeId phù hợp với backend.
      // Nếu backend service `submitReport` mong đợi một số nguyên và userId là string,
      // bạn có thể cần parse nó. Tuy nhiên, service hiện tại có default là 1.
      final String? employeeId = widget.currentUser?.userId;

      final response = await http.post(
        Uri.parse(
          '$_reportServiceBaseUrl/api/submit-report',
        ), // <<< Đảm bảo endpoint này đúng
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, dynamic>{
          'reportText': reportContent,
          'barcode': widget.scannedComponentCode, // Backend mong đợi 'barcode'
          'employeeId': employeeId, // Gửi employeeId, backend sẽ xử lý nếu null
        }),
      );

      print('--- Gửi Báo Cáo (Text) Lên Backend ---');
      print('URL: $_reportServiceBaseUrl/api/submit-report');
      print('Nội dung (reportText): $reportContent');
      print('Component Code (barcode): ${widget.scannedComponentCode}');
      print('Employee ID: $employeeId');
      print('------------------------------------');
      print('Mã trạng thái phản hồi từ Backend: ${response.statusCode}');
      print('Nội dung phản hồi từ Backend: ${response.body}');

      if (!mounted) return;
      final responseData = jsonDecode(response.body);

      // Backend trả về 201 Created khi tạo resource thành công
      if (response.statusCode == 201 && responseData['success'] == true) {
        setState(() {
          _isLoading = false;
          _isSuccess = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              responseData['message'] ??
                  'Gửi báo cáo và cập nhật component thành công!',
            ),
            backgroundColor: Colors.green,
          ),
        );
        Timer(const Duration(seconds: 2), () {
          if (mounted && Navigator.canPop(context)) {
            Navigator.pop(context, true);
          }
        });
      } else {
        throw Exception(
          responseData['message'] ?? 'Gửi báo cáo thất bại từ server.',
        );
      }
    } catch (error) {
      print("Lỗi khi gửi báo cáo lên backend: $error");
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Gửi báo cáo thất bại: ${error.toString().substring(0, (error.toString().length > 100) ? 100 : error.toString().length)}...',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const String managerName = "Nguyễn Văn A";

    return Scaffold(
      appBar: AppBar(
        title: const Text('Viết Báo Cáo'),
        backgroundColor: Colors.blueAccent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (!_isLoading) {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        padding: const EdgeInsets.all(16.0),
        decoration: BoxDecoration(
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hiển thị ảnh đã chụp (tùy chọn)
              // <<< THAY ĐỔI: Kiểm tra imagePath trước khi hiển thị >>>
              if (widget.imagePath != null && widget.imagePath!.isNotEmpty) ...[
                const Text(
                  'Ảnh tham chiếu:',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                Container(
                  constraints: const BoxConstraints(maxHeight: 150),
                  alignment: Alignment.center,
                  child:
                      kIsWeb
                          ? Image.network(
                            widget.imagePath!,
                            fit: BoxFit.contain,
                          )
                          : Image.file(
                            File(widget.imagePath!),
                            fit: BoxFit.contain,
                          ),
                ),
                const SizedBox(height: 15),
              ],

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
                    Text(
                      widget.currentUser?.fullName ??
                          managerName, // Sử dụng tên user nếu có
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_isLoading)
                      const SizedBox(
                        width: 24,
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
                      const SizedBox(width: 24, height: 24),
                  ],
                ),
              ),
              const SizedBox(height: 25),
              Text(
                'Nội dung báo cáo ${widget.scannedComponentCode != null ? "(cho Component: ${widget.scannedComponentCode})" : "(không có component cụ thể)"}:',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _reportContentController,
                maxLines: 8,
                minLines: 5,
                enabled: !_isLoading && !_isSuccess,
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
                    disabledBackgroundColor: Colors.grey[400],
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
