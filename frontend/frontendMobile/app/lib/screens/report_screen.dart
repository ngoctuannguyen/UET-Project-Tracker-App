import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert'; // For jsonEncode/Decode
import 'dart:io'; // For File
import 'dart:typed_data'; // For Uint8List
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // For MediaType

class ReportScreen extends StatefulWidget {
  final String imagePath;

  const ReportScreen({Key? key, required this.imagePath}) : super(key: key);

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final TextEditingController _reportContentController =
      TextEditingController();
  bool _isLoading = false;
  bool _isSuccess = false;

  // ...existing code...
  static final String _reportServiceBaseUrl =
      kIsWeb ? 'http://localhost:3004' : 'http://10.0.2.2:3004';
  // ...existing code...

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

    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _isSuccess = false;
    });

    try {
      final reportContent = _reportContentController.text;
      final imagePath = widget.imagePath;

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_reportServiceBaseUrl/api/scan-and-report'),
      );

      request.fields['reportText'] = reportContent;

      if (kIsWeb) {
        var imageDataResponse = await http.get(Uri.parse(imagePath));
        if (imageDataResponse.statusCode == 200) {
          Uint8List imageData = imageDataResponse.bodyBytes;
          request.files.add(
            http.MultipartFile.fromBytes(
              'image',
              imageData,
              filename: 'upload.jpg',
              contentType: MediaType('image', 'jpeg'),
            ),
          );
        } else {
          throw Exception(
            'Lỗi tải ảnh từ blob URL (web): ${imageDataResponse.statusCode}',
          );
        }
      } else {
        File imageFile = File(imagePath);
        if (!await imageFile.exists()) {
          throw Exception(
            'File ảnh không tồn tại tại đường dẫn (mobile): $imagePath',
          );
        }
        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            imagePath,
            contentType: MediaType('image', 'jpeg'),
          ),
        );
      }

      print('--- Gửi Báo Cáo Lên Backend ---');
      print('URL: ${request.url}');
      print('Nội dung (reportText): $reportContent');
      print('Trường file: image, path/url: $imagePath');
      print('-----------------------------');

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('Mã trạng thái phản hồi từ Backend: ${response.statusCode}');
      print('Nội dung phản hồi từ Backend: ${response.body}');

      if (!mounted) return;
      final responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (responseData['success'] == true) {
          setState(() {
            _isLoading = false;
            _isSuccess = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                responseData['message'] ?? 'Gửi báo cáo thành công!',
              ),
              backgroundColor: Colors.green,
            ),
          );
          Timer(const Duration(seconds: 2), () {
            if (mounted && Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          });
        } else {
          throw Exception(
            responseData['message'] ??
                'Gửi báo cáo thất bại từ server (success:false).',
          );
        }
      } else {
        throw Exception(
          responseData['message'] ?? 'Lỗi server: ${response.statusCode}.',
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
                      managerName,
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
              const Text(
                'Nội dung báo cáo:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
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
