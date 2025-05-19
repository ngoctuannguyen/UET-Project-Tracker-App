import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io'; // Import dart:io for File
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // Import for MediaType
import 'package:app/models/user_model.dart'; // Import UserModel
import 'package:firebase_auth/firebase_auth.dart'; // Để lấy user ID

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
  // bool _isLoading = false; // Sẽ dùng _isSubmitting thay thế
  bool _isSuccess = false;
  bool _isSubmitting = false; // Đã có
  // Map<String, dynamic>? _componentDetails; // Thêm biến để lưu trữ thông tin

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

    final String? customUserId = widget.currentUser?.userId;

    if (customUserId == null || customUserId.isEmpty) {
      if (!mounted) return; // Thêm kiểm tra mounted
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Không thể lấy User ID (mã người dùng) để gửi báo cáo.',
          ),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _isSuccess = false; // Reset _isSuccess khi bắt đầu gửi mới
    });

    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_reportServiceBaseUrl/api/submit-report'),
      );

      request.fields['reportText'] = _reportContentController.text;
      if (widget.scannedComponentCode != null) {
        request.fields['componentCode'] = widget.scannedComponentCode!;
      }
      request.fields['userId'] = customUserId;

      print('--- Submitting Report ---');
      print('Report Text: ${_reportContentController.text}');
      print('Component Code: ${widget.scannedComponentCode}');
      print('User ID (Custom User ID to be sent as userId): $customUserId');
      print('-------------------------');

      if (widget.imagePath != null && !kIsWeb) {
        File imageFile = File(widget.imagePath!);
        if (await imageFile.exists()) {
          request.files.add(
            await http.MultipartFile.fromPath(
              'reportImage',
              widget.imagePath!,
              contentType: MediaType('image', 'jpeg'),
            ),
          );
        }
      } else if (widget.imagePath != null && kIsWeb) {
        print(
          "Web image path: ${widget.imagePath} - Currently not re-uploading in report submission for web.",
        );
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201 && responseData['success'] == true) {
        setState(() {
          _isSuccess = true; // Đặt thành công
          _isSubmitting = false; // Dừng loading
        });
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Báo cáo đã được gửi thành công!')),
        );
        // Đợi một chút để người dùng thấy tick xanh rồi mới điều hướng
        await Future.delayed(const Duration(seconds: 2));
        if (!mounted) return;
        // Navigator.of(context).popUntil(
        //   (route) => route.isFirst,
        // );
        // Điều hướng về CameraScreen
        // Đảm bảo CameraScreen có một route name được định nghĩa trong MaterialApp
        // Ví dụ: '/camera_screen'
        // Hoặc nếu CameraScreen là màn hình trước đó trong stack, bạn có thể dùng pop nhiều lần
        // Để đơn giản, nếu CameraScreen là màn hình gốc của tab hoặc một màn hình cố định,
        // bạn có thể dùng Navigator.pushAndRemoveUntil hoặc popUntil với tên route cụ thể.
        // Giả sử CameraScreen là màn hình đầu tiên trong stack hiện tại của tab này:
        if (Navigator.canPop(context)) {
          // Pop cho đến khi về màn hình CameraScreen, giả sử nó là root của một navigator lồng nhau
          // hoặc là màn hình trước ReportScreen.
          // Nếu CameraScreen là màn hình gốc của ứng dụng (màn hình đầu tiên sau khi login)
          // thì popUntil route.isFirst là đúng.
          // Nếu bạn muốn quay lại màn hình Camera cụ thể, bạn cần một cách xác định nó.
          // Ví dụ, nếu CameraScreen là màn hình ngay trước ReportScreen:
          // Navigator.of(context).pop(); // Pop ReportScreen
          // Navigator.of(context).pop(); // Pop màn hình trước đó (ví dụ ImageSearchResultScreen)
          // Điều này phụ thuộc vào cách bạn điều hướng đến ReportScreen.

          // Cách an toàn hơn là pop về root của navigator hiện tại (thường là HomeScreen hoặc màn hình tab chính)
          // và sau đó có thể điều hướng lại CameraScreen nếu cần từ đó.
          // Hoặc nếu bạn biết tên route của CameraScreen:
          // Navigator.of(context).popUntil(ModalRoute.withName('/camera_screen'));
          // Hiện tại, để quay về màn hình trước đó (có thể là ImageSearchResultScreen hoặc ManualInputScreen)
          // rồi từ đó người dùng có thể quay lại Camera.
          // Hoặc nếu bạn muốn quay thẳng về màn hình gốc:
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(responseData['message'] ?? 'Gửi báo cáo thất bại.'),
          ),
        );
        setState(() {
          // Dừng loading khi thất bại
          _isSubmitting = false;
        });
      }
    } catch (e) {
      print("Lỗi khi gửi báo cáo: $e");
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi khi gửi báo cáo: $e')));
      setState(() {
        // Dừng loading khi có lỗi
        _isSubmitting = false;
      });
    }
    // finally { // Không cần finally nữa vì đã xử lý setState trong try/catch
    //   if (mounted){
    //     setState(() {
    //       _isSubmitting = false;
    //     });
    //   }
    // }
  }

  @override
  Widget build(BuildContext context) {
    const String defaultManagerName = "Người quản lý"; // Đổi tên mặc định

    return Scaffold(
      appBar: AppBar(
        title: const Text('Viết Báo Cáo'),
        backgroundColor: Colors.blueAccent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (!_isSubmitting) {
              // Chỉ cho phép pop nếu không đang gửi
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
                    Expanded(
                      // Cho phép Text co giãn nếu tên dài
                      child: Text(
                        widget.currentUser?.fullName ?? defaultManagerName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis, // Chống tràn text
                      ),
                    ),
                    // <<< THAY ĐỔI HIỂN THỊ ICON Ở ĐÂY >>>
                    if (_isSubmitting) // Nếu đang gửi
                      const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 3),
                      )
                    else if (_isSuccess) // Nếu gửi thành công
                      const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 28,
                      )
                    else // Trạng thái bình thường hoặc thất bại (không hiển thị gì thêm)
                      const SizedBox(
                        width: 24,
                        height: 24,
                      ), // Giữ chỗ để layout ổn định
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
                enabled:
                    !_isSubmitting &&
                    !_isSuccess, // Disable khi đang gửi hoặc đã thành công
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
                    _isSubmitting // <<< THAY ĐỔI TEXT NÚT DỰA TRÊN _isSubmitting và _isSuccess >>>
                        ? 'Đang gửi...'
                        : (_isSuccess ? 'Đã gửi' : 'Gửi báo cáo'),
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // Disable nút khi đang gửi hoặc đã gửi thành công (để chờ điều hướng)
                  onPressed: (_isSubmitting || _isSuccess) ? null : _sendReport,
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
                    disabledBackgroundColor:
                        _isSuccess
                            ? Colors.green.withOpacity(0.7)
                            : Colors.grey[400],
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
