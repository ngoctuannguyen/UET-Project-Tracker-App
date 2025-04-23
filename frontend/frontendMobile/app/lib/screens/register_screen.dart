// import 'package:flutter/gestures.dart';
// import 'package:flutter/material.dart';
// import 'package:app/screens/login_screen.dart'; // Để quay lại Login

// class RegisterScreen extends StatefulWidget {
//   const RegisterScreen({Key? key}) : super(key: key);

//   @override
//   State<RegisterScreen> createState() => _RegisterScreenState();
// }

// class _RegisterScreenState extends State<RegisterScreen> {
//   final _formKey = GlobalKey<FormState>();
//   final TextEditingController _nameController = TextEditingController();
//   final TextEditingController _emailController = TextEditingController();
//   final TextEditingController _passwordController = TextEditingController();
//   final TextEditingController _confirmPasswordController =
//       TextEditingController();
//   bool _isPasswordVisible = false;
//   bool _isConfirmPasswordVisible = false;

//   @override
//   void dispose() {
//     _nameController.dispose();
//     _emailController.dispose();
//     _passwordController.dispose();
//     _confirmPasswordController.dispose();
//     super.dispose();
//   }

//   void _register() {
//     if (_formKey.currentState!.validate()) {
//       // TODO: Implement registration logic here (API call)
//       print('Name: ${_nameController.text}');
//       print('Email: ${_emailController.text}');
//       print('Password: ${_passwordController.text}');

//       // Giả lập đăng ký thành công và quay lại màn hình Login (hoặc tự động đăng nhập)
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(
//           content: Text('Đăng ký thành công! Vui lòng đăng nhập.'),
//         ),
//       );
//       Navigator.pop(context); // Quay lại màn hình trước đó (Login)
//     } else {
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(
//           content: Text('Vui lòng điền đầy đủ và chính xác thông tin'),
//         ),
//       );
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     // Sử dụng lại _buildTextField từ LoginScreen hoặc định nghĩa lại ở đây
//     // Để đơn giản, ta sẽ copy lại helper function đó vào đây
//     Widget buildTextField({
//       required TextEditingController controller,
//       required String labelText,
//       bool obscureText = false,
//       TextInputType keyboardType = TextInputType.text,
//       Widget? suffixIcon,
//       String? Function(String?)? validator,
//     }) {
//       return Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text(
//             labelText,
//             style: TextStyle(
//               color: Colors.grey[800],
//               fontWeight: FontWeight.w500,
//             ),
//           ),
//           const SizedBox(height: 5),
//           TextFormField(
//             controller: controller,
//             obscureText: obscureText,
//             keyboardType: keyboardType,
//             style: const TextStyle(color: Colors.white),
//             decoration: InputDecoration(
//               filled: true,
//               fillColor: Colors.black.withOpacity(0.6),
//               contentPadding: const EdgeInsets.symmetric(
//                 horizontal: 15,
//                 vertical: 15,
//               ),
//               border: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: BorderSide.none,
//               ),
//               enabledBorder: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: BorderSide.none,
//               ),
//               focusedBorder: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: BorderSide(color: Colors.blue[300]!, width: 1.5),
//               ),
//               errorBorder: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: const BorderSide(
//                   color: Colors.redAccent,
//                   width: 1.5,
//                 ),
//               ),
//               focusedErrorBorder: OutlineInputBorder(
//                 borderRadius: BorderRadius.circular(10),
//                 borderSide: const BorderSide(
//                   color: Colors.redAccent,
//                   width: 1.5,
//                 ),
//               ),
//               hintText: 'Enter $labelText',
//               hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
//               suffixIcon: suffixIcon,
//               errorStyle: const TextStyle(
//                 color: Colors.redAccent,
//                 fontWeight: FontWeight.bold,
//               ),
//             ),
//             validator: validator,
//           ),
//         ],
//       );
//     }

//     return Scaffold(
//       // AppBar để có nút back tự động
//       appBar: AppBar(
//         backgroundColor: Colors.transparent, // Trong suốt để thấy gradient
//         elevation: 0,
//         leading: IconButton(
//           // Nút back tùy chỉnh nếu muốn
//           icon: const Icon(Icons.arrow_back, color: Colors.black54),
//           onPressed: () => Navigator.of(context).pop(),
//         ),
//       ),
//       // Mở rộng body ra sau AppBar
//       extendBodyBehindAppBar: true,
//       body: Container(
//         width: double.infinity, // Đảm bảo gradient phủ hết màn hình
//         height: double.infinity,
//         decoration: BoxDecoration(
//           gradient: LinearGradient(
//             colors: [
//               Colors.tealAccent[100] ?? Colors.greenAccent,
//               Colors.purple[100] ?? Colors.purpleAccent,
//             ],
//             begin: Alignment.topCenter,
//             end: Alignment.bottomCenter,
//           ),
//         ),
//         child: SafeArea(
//           child: Center(
//             child: SingleChildScrollView(
//               padding: const EdgeInsets.symmetric(
//                 horizontal: 30.0,
//                 vertical: 20.0,
//               ),
//               child: Form(
//                 key: _formKey,
//                 child: Column(
//                   mainAxisAlignment: MainAxisAlignment.center,
//                   crossAxisAlignment: CrossAxisAlignment.stretch,
//                   children: <Widget>[
//                     // Logo
//                     Image.asset(
//                       'assets/UET_logo.jpg',
//                       height: 80, // Logo nhỏ hơn ở trang đăng ký
//                     ),
//                     const SizedBox(height: 20),
//                     const Text(
//                       'Register',
//                       textAlign: TextAlign.center,
//                       style: TextStyle(
//                         fontSize: 28,
//                         fontWeight: FontWeight.bold,
//                         color: Colors.black87,
//                       ),
//                     ),
//                     const SizedBox(height: 30),

//                     // Name Field
//                     buildTextField(
//                       controller: _nameController,
//                       labelText: 'Full Name',
//                       keyboardType: TextInputType.name,
//                       validator: (value) {
//                         if (value == null || value.isEmpty) {
//                           return 'Vui lòng nhập họ tên';
//                         }
//                         return null;
//                       },
//                     ),
//                     const SizedBox(height: 20),

//                     // Email Field
//                     buildTextField(
//                       controller: _emailController,
//                       labelText: 'Email',
//                       keyboardType: TextInputType.emailAddress,
//                       validator: (value) {
//                         if (value == null || value.isEmpty)
//                           return 'Vui lòng nhập email';
//                         if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value))
//                           return 'Email không hợp lệ';
//                         return null;
//                       },
//                     ),
//                     const SizedBox(height: 20),

//                     // Password Field
//                     buildTextField(
//                       controller: _passwordController,
//                       labelText: 'Password',
//                       obscureText: !_isPasswordVisible,
//                       suffixIcon: IconButton(
//                         icon: Icon(
//                           _isPasswordVisible
//                               ? Icons.visibility_off
//                               : Icons.visibility,
//                           color: Colors.white70,
//                         ),
//                         onPressed:
//                             () => setState(
//                               () => _isPasswordVisible = !_isPasswordVisible,
//                             ),
//                       ),
//                       validator: (value) {
//                         if (value == null || value.isEmpty)
//                           return 'Vui lòng nhập mật khẩu';
//                         if (value.length < 6)
//                           return 'Mật khẩu phải có ít nhất 6 ký tự'; // Ví dụ validation
//                         return null;
//                       },
//                     ),
//                     const SizedBox(height: 20),

//                     // Confirm Password Field
//                     buildTextField(
//                       controller: _confirmPasswordController,
//                       labelText: 'Confirm Password',
//                       obscureText: !_isConfirmPasswordVisible,
//                       suffixIcon: IconButton(
//                         icon: Icon(
//                           _isConfirmPasswordVisible
//                               ? Icons.visibility_off
//                               : Icons.visibility,
//                           color: Colors.white70,
//                         ),
//                         onPressed:
//                             () => setState(
//                               () =>
//                                   _isConfirmPasswordVisible =
//                                       !_isConfirmPasswordVisible,
//                             ),
//                       ),
//                       validator: (value) {
//                         if (value == null || value.isEmpty)
//                           return 'Vui lòng xác nhận mật khẩu';
//                         if (value != _passwordController.text)
//                           return 'Mật khẩu không khớp';
//                         return null;
//                       },
//                     ),
//                     const SizedBox(height: 30),

//                     // Register Button
//                     ElevatedButton(
//                       onPressed: _register,
//                       child: const Text('Register'),
//                       style: ElevatedButton.styleFrom(
//                         backgroundColor: Colors.blue[400],
//                         foregroundColor: Colors.white,
//                         padding: const EdgeInsets.symmetric(vertical: 15),
//                         textStyle: const TextStyle(
//                           fontSize: 18,
//                           fontWeight: FontWeight.bold,
//                         ),
//                         shape: RoundedRectangleBorder(
//                           borderRadius: BorderRadius.circular(30),
//                         ),
//                         elevation: 5,
//                       ),
//                     ),
//                     const SizedBox(height: 25),

//                     // Login Link
//                     Text.rich(
//                       TextSpan(
//                         style: TextStyle(color: Colors.grey[800], fontSize: 14),
//                         children: [
//                           const TextSpan(text: "Already have an account? "),
//                           TextSpan(
//                             text: 'Login',
//                             style: TextStyle(
//                               color: Colors.blue[600],
//                               fontWeight: FontWeight.bold,
//                               decoration: TextDecoration.underline,
//                             ),
//                             recognizer:
//                                 TapGestureRecognizer()
//                                   ..onTap = () {
//                                     // Pop để quay lại màn hình Login thay vì push thêm
//                                     Navigator.pop(context);
//                                   },
//                           ),
//                         ],
//                       ),
//                       textAlign: TextAlign.center,
//                     ),
//                   ],
//                 ),
//               ),
//             ),
//           ),
//         ),
//       ),
//     );
//   }
// }
