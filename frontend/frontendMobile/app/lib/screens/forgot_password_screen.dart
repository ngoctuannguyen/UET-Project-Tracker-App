import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http; // Thêm import http
import 'dart:convert'; // Thêm import dart:convert
// import 'package:app/screens/login_screen.dart'; // Không cần nếu chỉ pop

// Định nghĩa URL API - Đảm bảo giống với LoginScreen và đúng với backend
// Thay <ĐỊA_CHỈ_IP_CỤC_BỘ_CỦA_BẠN> bằng IP cục bộ của máy tính bạn
// Thay 5000 bằng port backend của bạn nếu khác
const String apiUrl = 'http://localhost:3000';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  bool _isLoading = false; // Thêm trạng thái loading

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  // Hàm xử lý gửi link reset (async)
  Future<void> _sendResetLink() async {
    // Kiểm tra form và trạng thái loading
    if (_formKey.currentState!.validate() && !_isLoading) {
      setState(() {
        _isLoading = true; // Bắt đầu loading
      });

      final String email =
          _emailController.text
              .trim(); // Lấy email và loại bỏ khoảng trắng thừa

      try {
        final response = await http.post(
          Uri.parse('$apiUrl/api/auth/forgot-password'), // Endpoint backend
          headers: <String, String>{
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: jsonEncode(<String, String>{'email': email}),
        );

        if (!mounted) return; // Kiểm tra widget còn tồn tại

        if (response.statusCode == 200) {
          // Thành công (Backend trả về 200)
          print('Yêu cầu reset mật khẩu thành công cho email: $email');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.',
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3), // Hiển thị lâu hơn chút
            ),
          );
          // Đợi chút rồi quay lại màn hình trước đó (Login)
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) {
              Navigator.pop(context);
            }
          });
        } else {
          // Xử lý lỗi từ backend (ví dụ: lỗi server 500, lỗi validation khác nếu có)
          String errorMessage = 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
          try {
            final responseBody = jsonDecode(response.body);
            errorMessage = responseBody['error'] ?? errorMessage;
          } catch (e) {
            // Nếu body không phải JSON hoặc không có key 'error'
            print('Không thể parse lỗi từ backend: ${response.body}');
          }
          print('Lỗi gửi link reset: ${response.statusCode} - $errorMessage');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: $errorMessage'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } catch (e) {
        // Xử lý lỗi mạng hoặc lỗi khác (không kết nối được server, timeout,...)
        print('Lỗi mạng khi gửi link reset: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi kết nối đến máy chủ: $e'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } finally {
        // Dừng loading bất kể thành công hay thất bại
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent, // Trong suốt để thấy gradient
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black54),
          // Vô hiệu hóa nút back khi đang loading
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
        ),
      ),
      extendBodyBehindAppBar: true, // Cho phép body tràn lên dưới AppBar
      body: Container(
        width: double.infinity,
        height: double.infinity,
        // Gradient background giống Login
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.tealAccent[100] ?? Colors.greenAccent,
              Colors.purple[100] ?? Colors.purpleAccent,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: 30.0,
                vertical: 20.0,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Image.asset('assets/UET_logo.jpg', height: 80),
                    const SizedBox(height: 20),
                    const Text(
                      'Forgot Password',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 15),
                    Text(
                      'Enter your email address below and we will send you a link to reset your password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[700], fontSize: 14),
                    ),
                    const SizedBox(height: 30),

                    // Email Field
                    _buildTextField(
                      // Gọi hàm helper
                      controller: _emailController,
                      labelText: 'Email',
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          // Thêm trim()
                          return 'Vui lòng nhập email';
                        }
                        // Regex kiểm tra email đơn giản
                        if (!RegExp(
                          r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                        ).hasMatch(value.trim())) {
                          // Thêm trim()
                          return 'Email không hợp lệ';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 30),

                    // Send Reset Link Button
                    ElevatedButton(
                      onPressed:
                          _isLoading
                              ? null
                              : _sendResetLink, // Gọi hàm async, vô hiệu hóa khi loading
                      child:
                          _isLoading
                              ? const SizedBox(
                                // Hiển thị loading indicator
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 3,
                                ),
                              )
                              : const Text('Send Reset Link'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[400],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        textStyle: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 5,
                      ),
                    ),
                    const SizedBox(height: 25),

                    // Back to Login Link
                    Text.rich(
                      TextSpan(
                        style: TextStyle(color: Colors.grey[800], fontSize: 14),
                        children: [
                          TextSpan(
                            text: 'Back to Login',
                            style: TextStyle(
                              color: Colors.blue[600],
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                            ),
                            recognizer:
                                TapGestureRecognizer()
                                  ..onTap = () {
                                    // Chặn điều hướng khi đang loading
                                    if (!_isLoading) {
                                      Navigator.pop(context);
                                    }
                                  },
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Helper widget để tạo TextField (đặt ở đây hoặc bên ngoài class)
  Widget _buildTextField({
    required TextEditingController controller,
    required String labelText,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          labelText,
          style: TextStyle(
            color: Colors.grey[800],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 5),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white), // Màu chữ nhập vào
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.6), // Nền ô nhập
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 15,
              vertical: 15,
            ),
            border: OutlineInputBorder(
              // Viền mặc định
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none, // Không viền
            ),
            enabledBorder: OutlineInputBorder(
              // Viền khi không focus
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              // Viền khi focus
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.blue[300]!, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              // Viền khi có lỗi
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
            focusedErrorBorder: OutlineInputBorder(
              // Viền khi có lỗi và focus
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
            hintText: 'Enter $labelText',
            hintStyle: TextStyle(
              color: Colors.white.withOpacity(0.5),
            ), // Màu chữ gợi ý
            suffixIcon: suffixIcon,
            errorStyle: const TextStyle(
              // Style cho text báo lỗi
              color: Colors.redAccent,
              fontWeight: FontWeight.bold,
            ),
          ),
          validator: validator,
        ),
      ],
    );
  }
}
