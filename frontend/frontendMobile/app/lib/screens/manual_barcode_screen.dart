import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:app/models/user_model.dart';
import 'package:app/screens/report_screen.dart';

class ManualBarcodeScreen extends StatefulWidget {
  final UserModel? currentUser;

  const ManualBarcodeScreen({Key? key, this.currentUser}) : super(key: key);

  @override
  State<ManualBarcodeScreen> createState() => _ManualBarcodeScreenState();
}

class _ManualBarcodeScreenState extends State<ManualBarcodeScreen> {
  final TextEditingController _barcodeController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _componentDetails;
  String? _enteredBarcode;

  static final String _apiBaseUrl =
      kIsWeb ? 'http://localhost:3004' : 'http://10.0.2.2:3004';

  Future<void> _fetchComponentDetails() async {
    if (_barcodeController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = "Vui lòng nhập mã barcode.";
        _componentDetails = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _componentDetails = null;
      _enteredBarcode = _barcodeController.text.trim();
    });

    try {
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/component-details/$_enteredBarcode'),
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        if (responseData['success'] == true &&
            responseData['details'] != null) {
          setState(() {
            _componentDetails = Map<String, dynamic>.from(
              responseData['details'],
            );
            _isLoading = false;
            _errorMessage = null; // Xóa thông báo lỗi nếu thành công
          });

          // <<< THÊM: Kiểm tra is_complete >>>
          final dynamic isCompleteValue = _componentDetails!['is_complete'];
          bool componentIsComplete = false;
          if (isCompleteValue is bool) {
            componentIsComplete = isCompleteValue;
          } else if (isCompleteValue is int) {
            componentIsComplete = isCompleteValue == 1;
          } else if (isCompleteValue is String) {
            componentIsComplete = isCompleteValue == "1";
          }

          if (componentIsComplete) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Thành phần này đã hoàn thành!')),
              );
              // Quay lại CameraScreen hoặc màn hình trước đó phù hợp
              // Nếu ManualBarcodeScreen được mở từ CameraScreen hoặc một màn hình có thể quay lại CameraScreen
              Navigator.of(context).popUntil(ModalRoute.withName('/camera'));
              return; // Dừng xử lý
            }
          }
        } else {
          setState(() {
            _errorMessage =
                responseData['message'] ??
                'Không tìm thấy thông tin component.';
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Lỗi HTTP: ${response.statusCode}';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Lỗi kết nối hoặc xử lý: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToReportScreen() {
    if (_componentDetails != null && _enteredBarcode != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder:
              (context) => ReportScreen(
                imagePath: '', // Không có ảnh từ luồng này, truyền chuỗi rỗng
                currentUser: widget.currentUser,
                scannedComponentCode: _enteredBarcode,
              ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _barcodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhập mã Barcode'),
        backgroundColor: Colors.blueAccent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _barcodeController,
              decoration: InputDecoration(
                labelText: 'Mã Barcode',
                hintText: 'Nhập mã barcode tại đây',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () => _barcodeController.clear(),
                ),
              ),
              keyboardType: TextInputType.text,
              onSubmitted: (_) => _fetchComponentDetails(),
            ),
            const SizedBox(height: 16.0),
            ElevatedButton.icon(
              icon: const Icon(Icons.search),
              label: const Text('Hiển thị thông tin'),
              onPressed: _isLoading ? null : _fetchComponentDetails,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orangeAccent,
                padding: const EdgeInsets.symmetric(vertical: 12.0),
              ),
            ),
            const SizedBox(height: 20.0),
            if (_isLoading) const Center(child: CircularProgressIndicator()),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ),
            if (_componentDetails != null) ...[
              const Text(
                'Thông tin chi tiết:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8.0),
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mã Barcode: ${_componentDetails!['componentCode'] ?? 'N/A'}',
                      ),
                      Text(
                        'Tên thành phần: ${_componentDetails!['componentName'] ?? 'N/A'}',
                      ),
                      Text(
                        'Mã sản phẩm: ${_componentDetails!['productCode'] ?? 'N/A'}',
                      ),
                      Text(
                        'Tên sản phẩm: ${_componentDetails!['productName'] ?? 'N/A'}',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20.0),
              ElevatedButton.icon(
                icon: const Icon(Icons.edit_note),
                label: const Text('Viết báo cáo'),
                onPressed: _navigateToReportScreen,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
