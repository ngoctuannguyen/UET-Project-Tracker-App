import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http; // Import gói http
import 'dart:convert'; // Import dart:convert để dùng jsonEncode/Decode
import 'package:app/screens/home_screen.dart';
// import 'package:app/screens/register_screen.dart'; // Đã loại bỏ import này
import 'package:app/screens/forgot_password_screen.dart';
// TODO: Import gói lưu trữ an toàn (ví dụ: flutter_secure_storage)
// import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Định nghĩa URL API - NHỚ THAY ĐỔI ĐỊA CHỈ IP NẾU CHẠY TRÊN ĐIỆN THOẠI THẬT
// const String apiUrl = 'http://10.0.2.2:3000'; // Dùng cho máy ảo Android
const String apiUrl =
    'http://192.168.1.7:5000'; // Dùng cho điện thoại thật (thay IP của bạn vào đây)

// TODO: Khởi tạo secure storage
// final storage = FlutterSecureStorage();

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false; // Trạng thái loading

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // Hàm xử lý đăng nhập (async)
  Future<void> _login() async {
    // Kiểm tra form và trạng thái loading
    if (_formKey.currentState!.validate() && !_isLoading) {
      setState(() {
        _isLoading = true; // Bắt đầu loading
      });

      final String email = _emailController.text.trim();
      final String password = _passwordController.text.trim();

      try {
        final response = await http.post(
          Uri.parse('$apiUrl/api/auth/login'), // Endpoint đăng nhập backend
          headers: <String, String>{
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: jsonEncode(<String, String>{
            'email': email,
            'password': password,
          }),
        );

        if (!mounted) return; // Kiểm tra nếu widget còn tồn tại

        if (response.statusCode == 200) {
          // Đăng nhập thành công
          print('Đăng nhập thành công: ${response.body}');
          final responseBody = jsonDecode(response.body);
          final String idToken = responseBody['idToken'];
          final String refreshToken = responseBody['refreshToken'];
          final String uid = responseBody['uid'];

          // TODO: Lưu trữ token an toàn
          // await storage.write(key: 'idToken', value: idToken);
          // await storage.write(key: 'refreshToken', value: refreshToken);
          // await storage.write(key: 'uid', value: uid);

          // Điều hướng đến HomeScreen
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const HomeScreen()),
          );
        } else {
          // Đăng nhập thất bại
          final responseBody = jsonDecode(response.body);
          // Lấy lỗi từ backend, nếu không có thì dùng thông báo mặc định
          final errorMessage =
              responseBody['error'] ?? 'Email hoặc mật khẩu không đúng.';
          print('Đăng nhập thất bại: ${response.statusCode} - $errorMessage');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đăng nhập thất bại: $errorMessage'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } catch (e) {
        // Xử lý lỗi mạng hoặc lỗi khác
        print('Lỗi đăng nhập: $e');
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
    } else if (!_isLoading) {
      // Hiển thị thông báo nếu form không hợp lệ (khi không loading)
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đầy đủ thông tin')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        // Gradient background
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
                    Image.asset('assets/UET_logo.jpg', height: 100),
                    const SizedBox(height: 30),
                    const Text(
                      'Login',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 30),
                    _buildTextField(
                      controller: _emailController,
                      labelText: 'Email',
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Vui lòng nhập email';
                        }
                        if (!RegExp(
                          r'^[^@]+@[^@]+\.[^@]+',
                        ).hasMatch(value.trim())) {
                          return 'Vui lòng nhập email hợp lệ';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    _buildTextField(
                      controller: _passwordController,
                      labelText: 'Password',
                      obscureText: !_isPasswordVisible,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordVisible
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.white70,
                        ),
                        onPressed: () {
                          setState(() {
                            _isPasswordVisible = !_isPasswordVisible;
                          });
                        },
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Vui lòng nhập mật khẩu';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed:
                          _isLoading
                              ? null
                              : _login, // Vô hiệu hóa nút khi đang loading
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
                              : const Text('Sign in'),
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
                    // Đã loại bỏ phần TextSpan "Register"
                    Text.rich(
                      TextSpan(
                        style: TextStyle(color: Colors.grey[800], fontSize: 14),
                        children: [
                          // const TextSpan(text: "Don't have an account? "), // Dòng này cũng có thể bỏ nếu không cần
                          TextSpan(
                            text:
                                'Forget password?', // Chỉ còn lại quên mật khẩu
                            style: TextStyle(
                              color: Colors.blue[600],
                              decoration: TextDecoration.underline,
                            ),
                            recognizer:
                                TapGestureRecognizer()
                                  ..onTap = () {
                                    if (!_isLoading) {
                                      // Chặn điều hướng khi đang loading
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder:
                                              (context) =>
                                                  const ForgotPasswordScreen(),
                                        ),
                                      );
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

  // Helper widget để tạo TextField (giữ nguyên)
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
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.6),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 15,
              vertical: 15,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.blue[300]!, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
            ),
            hintText: 'Enter $labelText',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
            suffixIcon: suffixIcon,
            errorStyle: const TextStyle(
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
