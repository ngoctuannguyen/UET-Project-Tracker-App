import 'dart:io';
import 'dart:convert'; // For jsonDecode
import 'dart:typed_data'; // For Uint8List
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart'; // For MediaType
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/camera_screen.dart';
import 'package:app/screens/report_screen.dart';
import 'package:app/models/user_model.dart';

class ImageSearchResultScreen extends StatefulWidget {
  final String imagePath;
  final UserModel? currentUser;
  final bool isFromFrontCameraOnWeb;

  const ImageSearchResultScreen({
    Key? key,
    required this.imagePath,
    this.currentUser,
    this.isFromFrontCameraOnWeb = false,
  }) : super(key: key);

  @override
  State<ImageSearchResultScreen> createState() =>
      _ImageSearchResultScreenState();
}

class _ImageSearchResultScreenState extends State<ImageSearchResultScreen> {
  String _searchResult = "Đang quét barcode và tìm thông tin...";
  bool _isSearching = true;
  Map<String, dynamic>? _componentDetails; // Lưu trữ chi tiết component
  String? _scannedBarcode; // Lưu trữ barcode quét được

  // URL của backend
  static final String _apiBaseUrl =
      kIsWeb ? 'http://localhost:3004' : 'http://10.0.2.2:3004';

  @override
  void initState() {
    super.initState();
    print(
      "ImageSearchResultScreen initState: currentUser is ${widget.currentUser?.fullName}",
    );
    print("Image path: ${widget.imagePath}");
    print("Is from front camera on web: ${widget.isFromFrontCameraOnWeb}");
    _fetchBarcodeAndDetails(); // <<< THAY ĐỔI: Gọi hàm mới
  }

  // <<< THAY ĐỔI: Tên hàm và logic để gọi API /api/scan-details >>>
  Future<void> _fetchBarcodeAndDetails() async {
    if (!mounted) return;
    setState(() {
      _isSearching = true;
      _searchResult = "Đang quét barcode và tìm thông tin...";
      _componentDetails = null;
      _scannedBarcode = null;
    });

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse(
          '$_apiBaseUrl/api/scan-details',
        ), // <<< THAY ĐỔI: Endpoint mới
      );

      if (kIsWeb) {
        var imageDataResponse = await http.get(Uri.parse(widget.imagePath));
        if (imageDataResponse.statusCode == 200) {
          Uint8List imageData = imageDataResponse.bodyBytes;
          request.files.add(
            http.MultipartFile.fromBytes(
              'image',
              imageData,
              filename: 'upload_scan.jpg',
              contentType: MediaType('image', 'jpeg'),
            ),
          );
        } else {
          throw Exception(
            'Lỗi tải ảnh từ blob URL (web): ${imageDataResponse.statusCode}',
          );
        }
      } else {
        File imageFile = File(widget.imagePath);
        if (!await imageFile.exists()) {
          throw Exception(
            'File ảnh không tồn tại (mobile): ${widget.imagePath}',
          );
        }
        request.files.add(
          await http.MultipartFile.fromPath(
            'image',
            widget.imagePath,
            contentType: MediaType('image', 'jpeg'),
          ),
        );
      }
      print('--- Gọi API /api/scan-details ---');
      print('URL: ${request.url}');
      print('File path/url: ${widget.imagePath}');
      print('---------------------------------');

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('Scan Details API Response Status: ${response.statusCode}');
      print('Scan Details API Response Body: ${response.body}');

      if (!mounted) return;
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _scannedBarcode = responseData['barcode']; // Lưu barcode quét được
        if (responseData['componentDetails'] != null) {
          _componentDetails = Map<String, dynamic>.from(
            responseData['componentDetails'],
          ); // Lưu chi tiết component
          setState(() {
            _searchResult =
                "Barcode: ${_componentDetails!['componentCode']}\n"
                "Mã sản phẩm: ${_componentDetails!['productCode']}\n"
                "Tên sản phẩm: ${_componentDetails!['productName']}\n"
                "Tên thành phần: ${_componentDetails!['componentName']}";
          });
        } else if (_scannedBarcode != null) {
          // Trường hợp quét được barcode nhưng không có chi tiết
          setState(() {
            _searchResult =
                "Đã quét được Barcode: $_scannedBarcode\nTuy nhiên, không tìm thấy thông tin chi tiết cho thành phần này.";
          });
        } else {
          // Trường hợp không quét được barcode
          setState(() {
            _searchResult =
                responseData['message'] ??
                "Không tìm thấy barcode hoặc thông tin chi tiết.";
          });
        }
      } else {
        // Lỗi từ server hoặc API trả về success: false
        setState(() {
          _searchResult =
              responseData['message'] ??
              "Lỗi từ server hoặc không tìm thấy thông tin.";
          _scannedBarcode =
              responseData['barcode']; // Vẫn có thể có barcode nếu server trả về
        });
      }
    } catch (error) {
      print("Lỗi khi gọi API /api/scan-details: $error");
      if (mounted) {
        setState(() {
          _searchResult =
              "Lỗi khi quét ảnh: ${error.toString().substring(0, (error.toString().length > 100) ? 100 : error.toString().length)}...";
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }

  Widget _buildImageWidget() {
    Widget imageWidget;
    if (kIsWeb) {
      // Đối với web, imagePath có thể là blob URL
      imageWidget = Image.network(widget.imagePath, fit: BoxFit.contain);
    } else {
      // Đối với mobile, imagePath là đường dẫn file cục bộ
      imageWidget = Image.file(File(widget.imagePath), fit: BoxFit.contain);
    }

    // Áp dụng lật ảnh nếu là web và từ camera trước
    if (kIsWeb && widget.isFromFrontCameraOnWeb) {
      print("Áp dụng Transform.scale(scaleX: -1) cho ảnh trên web.");
      return Transform.scale(
        scaleX: -1, // Lật theo chiều ngang
        child: imageWidget,
      );
    }
    return imageWidget;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kết quả Quét Ảnh'),
        backgroundColor: Colors.blueAccent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            if (widget.currentUser != null)
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        child: Text(
                          widget.currentUser!.fullName[0].toUpperCase(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        widget.currentUser!.fullName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 20),
            const Text(
              'Ảnh đã chụp:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Container(
              constraints: const BoxConstraints(maxHeight: 300),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(7.0),
                child: _buildImageWidget(),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Kết quả tìm kiếm:', // <<< THAY ĐỔI: Tiêu đề chung hơn
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            _isSearching
                ? const Center(child: CircularProgressIndicator())
                : Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      _searchResult.isNotEmpty
                          ? _searchResult
                          : "Không có thông tin.",
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
            const SizedBox(height: 30),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: FloatingActionButton.extended(
        onPressed:
            (_isSearching ||
                    widget.currentUser == null ||
                    _scannedBarcode ==
                        null || // <<< THÊM: Chỉ cho phép viết báo cáo nếu có barcode
                    _scannedBarcode!.isEmpty)
                ? null
                : () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder:
                          (context) => ReportScreen(
                            imagePath: widget.imagePath,
                            currentUser: widget.currentUser,
                            scannedComponentCode:
                                _scannedBarcode, // <<< THAY ĐỔI: Truyền barcode đã quét được
                          ),
                      settings: const RouteSettings(name: '/report'),
                    ),
                  );
                },
        icon: const Icon(Icons.report_problem_outlined),
        label: const Text('Viết Báo Cáo'),
        backgroundColor:
            (_scannedBarcode != null && _scannedBarcode!.isNotEmpty)
                ? Colors.redAccent
                : Colors.grey, // Thay đổi màu nếu không có barcode
      ),
    );
  }
}
