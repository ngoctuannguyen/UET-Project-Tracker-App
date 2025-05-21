import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/forgot_password_screen.dart';
import 'package:app/services/user_service.dart';
import 'package:app/models/user_model.dart';
import 'package:app/services/auth_service.dart'; // <<< THÊM: Import AuthService

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
  bool _isLoading = false;
  final UserService _userService = UserService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final AuthService _authService =
      AuthService(); // <<< THÊM: Khởi tạo AuthService

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_formKey.currentState!.validate() && !_isLoading) {
      setState(() {
        _isLoading = true;
      });

      final String email = _emailController.text.trim();
      final String password = _passwordController.text.trim();

      try {
        UserCredential userCredential = await _auth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        if (!mounted) return;

        if (userCredential.user != null) {
          final String authUid = userCredential.user!.uid;
          final String? idToken = await userCredential.user!.getIdToken();

          print('Đăng nhập Firebase Auth thành công. UID: $authUid');

          if (idToken == null) {
            print('Lỗi: Không thể lấy được ID Token từ Firebase.');
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Lỗi xác thực: Không thể lấy token. Vui lòng thử lại.',
                  ),
                  backgroundColor: Colors.red,
                ),
              );
            }
            await _auth.signOut();
            return;
          }

          await _authService.saveToken(idToken);

          UserModel? loggedInUser = await _userService.getUserByAuthUid(
            authUid,
          );

          if (!mounted) return;

          if (loggedInUser != null) {
            print(
              'Lấy được thông tin user từ Firestore: ${loggedInUser.fullName}, docId: ${loggedInUser.docId}, userId: ${loggedInUser.userId}, role: ${loggedInUser.role}',
            );

            // <<< KIỂM TRA ROLE NGƯỜI DÙNG >>>
            if (loggedInUser.role == "1") {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => HomeScreen(currentUser: loggedInUser),
                ),
              );
            } else {
              // Người dùng không có quyền truy cập
              print(
                'Lỗi: Người dùng không có quyền truy cập (role: ${loggedInUser.role}). Yêu cầu role "1".',
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Bạn không có quyền truy cập ứng dụng này.'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
              await _auth.signOut(); // Đăng xuất người dùng
              await _authService.deleteToken(); // Xóa token đã lưu
            }
          } else {
            // Không tìm thấy dữ liệu Firestore cho người dùng đã xác thực
            print(
              'Lỗi: Không tìm thấy dữ liệu Firestore cho Auth UID: [$authUid]',
            );
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Lỗi: Không tìm thấy dữ liệu người dùng liên kết trong hệ thống.',
                  ),
                  backgroundColor: Colors.red,
                ),
              );
            }
            await _auth.signOut();
            await _authService.deleteToken();
          }
        } else {
          print('Lỗi: UserCredential có user là null sau khi đăng nhập.');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Đăng nhập thất bại. Vui lòng thử lại.'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      } on FirebaseAuthException catch (e) {
        print('Lỗi đăng nhập Firebase Auth: ${e.code} - ${e.message}');
        String errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
        if (e.code == 'user-not-found' ||
            e.code == 'wrong-password' ||
            e.code == 'invalid-credential') {
          errorMessage = 'Email hoặc mật khẩu không đúng.';
        } else if (e.code == 'invalid-email') {
          errorMessage = 'Định dạng email không hợp lệ.';
        } else if (e.code == 'user-disabled') {
          errorMessage = 'Tài khoản này đã bị vô hiệu hóa.';
        } else if (e.code == 'too-many-requests') {
          errorMessage = 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.';
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } catch (e) {
        print('Lỗi khác trong quá trình đăng nhập: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đã xảy ra lỗi không mong muốn: $e'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } else if (!_isLoading) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đầy đủ thông tin')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // ... Phần UI (Scaffold, Container, Form, TextFields, Button, Text.rich) giữ nguyên như cũ ...
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
                      onPressed: _isLoading ? null : _login,
                      child:
                          _isLoading
                              ? const SizedBox(
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
                    Text.rich(
                      TextSpan(
                        style: TextStyle(color: Colors.grey[800], fontSize: 14),
                        children: [
                          TextSpan(
                            text: 'Forget password?',
                            style: TextStyle(
                              color: Colors.blue[600],
                              decoration: TextDecoration.underline,
                            ),
                            recognizer:
                                TapGestureRecognizer()
                                  ..onTap = () {
                                    if (!_isLoading) {
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
