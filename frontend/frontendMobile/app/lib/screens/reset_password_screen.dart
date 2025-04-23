// import 'package:flutter/material.dart';
// import 'package:firebase_auth/firebase_auth.dart';
// import 'package:app/screens/login_screen.dart'; // Để điều hướng về login sau khi thành công

// class ResetPasswordScreen extends StatefulWidget {
//   final String? oobCode; // Nhận oobCode từ URL hoặc arguments

//   const ResetPasswordScreen({Key? key, this.oobCode}) : super(key: key);

//   // Định nghĩa route name để dễ dàng điều hướng
//   static const String routeName = '/reset-password';

//   @override
//   State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
// }

// class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
//   final _formKey = GlobalKey<FormState>();
//   final TextEditingController _passwordController = TextEditingController();
//   final TextEditingController _confirmPasswordController =
//       TextEditingController();
//   bool _isLoading = false;
//   bool _isPasswordVisible = false;
//   bool _isConfirmPasswordVisible = false;
//   String? _oobCode; // Lưu trữ oobCode

//   @override
//   void initState() {
//     super.initState();
//     // Cố gắng lấy oobCode từ widget.oobCode (nếu được truyền qua constructor)
//     _oobCode = widget.oobCode;

//     // Nếu không có, thử lấy từ URI (cho trường hợp web hoặc deep link)
//     // Lưu ý: Cách này chỉ hoạt động tốt trên web.
//     // Đối với mobile deep link, bạn cần cấu hình và xử lý phức tạp hơn.
//     if (_oobCode == null && Uri.base.hasQuery) {
//       _oobCode = Uri.base.queryParameters['oobCode'];
//     }

//     // Hiển thị cảnh báo nếu không tìm thấy oobCode
//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       if (_oobCode == null || _oobCode!.isEmpty) {
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(
//             content: Text('Lỗi: Không tìm thấy mã đặt lại mật khẩu hợp lệ.'),
//             backgroundColor: Colors.redAccent,
//           ),
//         );
//         // Có thể điều hướng về login nếu không có code
//         // Navigator.pushReplacementNamed(context, LoginScreen.routeName);
//       }
//     });
//   }

//   @override
//   void dispose() {
//     _passwordController.dispose();
//     _confirmPasswordController.dispose();
//     super.dispose();
//   }

//   Future<void> _handlePasswordReset() async {
//     if (_oobCode == null || _oobCode!.isEmpty) {
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(
//           content: Text(
//             'Lỗi: Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
//           ),
//           backgroundColor: Colors.redAccent,
//         ),
//       );
//       return;
//     }

//     if (_formKey.currentState!.validate() && !_isLoading) {
//       setState(() {
//         _isLoading = true;
//       });

//       try {
//         // Gọi hàm của Firebase Auth để xác nhận mật khẩu mới
//         await FirebaseAuth.instance.confirmPasswordReset(
//           code: _oobCode!,
//           newPassword: _passwordController.text,
//         );

//         if (!mounted) return;

//         // Thành công
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(
//             content: Text(
//               'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.',
//             ),
//             backgroundColor: Colors.green,
//             duration: Duration(seconds: 3),
//           ),
//         );

//         // Điều hướng về màn hình Login sau khi thành công
//         Navigator.pushAndRemoveUntil(
//           context,
//           MaterialPageRoute(builder: (context) => const LoginScreen()),
//           (Route<dynamic> route) => false, // Xóa hết các route trước đó
//         );
//       } on FirebaseAuthException catch (e) {
//         if (!mounted) return;
//         print("Lỗi confirmPasswordReset: ${e.code} - ${e.message}");
//         String errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";
//         if (e.code == 'expired-action-code') {
//           errorMessage =
//               'Mã đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.';
//         } else if (e.code == 'invalid-action-code') {
//           errorMessage =
//               'Mã đặt lại mật khẩu không hợp lệ. Vui lòng kiểm tra lại link hoặc yêu cầu lại.';
//         } else if (e.code == 'user-disabled') {
//           errorMessage = 'Tài khoản này đã bị vô hiệu hóa.';
//         } else if (e.code == 'user-not-found') {
//           errorMessage = 'Không tìm thấy người dùng tương ứng với mã này.';
//         } else if (e.code == 'weak-password') {
//           errorMessage = 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
//         }
//         ScaffoldMessenger.of(context).showSnackBar(
//           SnackBar(
//             content: Text('Lỗi: $errorMessage'),
//             backgroundColor: Colors.redAccent,
//           ),
//         );
//       } catch (e) {
//         if (!mounted) return;
//         print("Lỗi không xác định khi reset password: $e");
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(
//             content: Text('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'),
//             backgroundColor: Colors.redAccent,
//           ),
//         );
//       } finally {
//         if (mounted) {
//           setState(() {
//             _isLoading = false;
//           });
//         }
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: const Text('Đặt lại mật khẩu'),
//         backgroundColor: Colors.transparent,
//         elevation: 0,
//         foregroundColor: Colors.black54, // Màu chữ và icon trên AppBar
//       ),
//       extendBodyBehindAppBar: true,
//       body: Container(
//         // Gradient background tương tự các màn hình khác
//         width: double.infinity,
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
//                     // Có thể thêm logo hoặc hình ảnh nếu muốn
//                     const Text(
//                       'Nhập mật khẩu mới',
//                       textAlign: TextAlign.center,
//                       style: TextStyle(
//                         fontSize: 22,
//                         fontWeight: FontWeight.bold,
//                         color: Colors.black87,
//                       ),
//                     ),
//                     const SizedBox(height: 20),
//                     // New Password Field
//                     _buildTextField(
//                       controller: _passwordController,
//                       labelText: 'Mật khẩu mới',
//                       obscureText: !_isPasswordVisible,
//                       validator: (value) {
//                         if (value == null || value.isEmpty) {
//                           return 'Vui lòng nhập mật khẩu mới';
//                         }
//                         if (value.length < 6) {
//                           return 'Mật khẩu phải có ít nhất 6 ký tự';
//                         }
//                         return null;
//                       },
//                       suffixIcon: IconButton(
//                         icon: Icon(
//                           _isPasswordVisible
//                               ? Icons.visibility_off
//                               : Icons.visibility,
//                           color: Colors.white70,
//                         ),
//                         onPressed: () {
//                           setState(() {
//                             _isPasswordVisible = !_isPasswordVisible;
//                           });
//                         },
//                       ),
//                     ),
//                     const SizedBox(height: 20),
//                     // Confirm Password Field
//                     _buildTextField(
//                       controller: _confirmPasswordController,
//                       labelText: 'Xác nhận mật khẩu mới',
//                       obscureText: !_isConfirmPasswordVisible,
//                       validator: (value) {
//                         if (value == null || value.isEmpty) {
//                           return 'Vui lòng xác nhận mật khẩu mới';
//                         }
//                         if (value != _passwordController.text) {
//                           return 'Mật khẩu xác nhận không khớp';
//                         }
//                         return null;
//                       },
//                       suffixIcon: IconButton(
//                         icon: Icon(
//                           _isConfirmPasswordVisible
//                               ? Icons.visibility_off
//                               : Icons.visibility,
//                           color: Colors.white70,
//                         ),
//                         onPressed: () {
//                           setState(() {
//                             _isConfirmPasswordVisible =
//                                 !_isConfirmPasswordVisible;
//                           });
//                         },
//                       ),
//                     ),
//                     const SizedBox(height: 30),
//                     // Submit Button
//                     ElevatedButton(
//                       onPressed:
//                           (_isLoading || _oobCode == null || _oobCode!.isEmpty)
//                               ? null
//                               : _handlePasswordReset,
//                       child:
//                           _isLoading
//                               ? const SizedBox(
//                                 height: 20,
//                                 width: 20,
//                                 child: CircularProgressIndicator(
//                                   color: Colors.white,
//                                   strokeWidth: 3,
//                                 ),
//                               )
//                               : const Text('Đặt lại mật khẩu'),
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
//                   ],
//                 ),
//               ),
//             ),
//           ),
//         ),
//       ),
//     );
//   }

//   // Helper widget để tạo TextField (giống trong ForgotPasswordScreen)
//   Widget _buildTextField({
//     required TextEditingController controller,
//     required String labelText,
//     bool obscureText = false,
//     TextInputType keyboardType = TextInputType.text,
//     Widget? suffixIcon,
//     String? Function(String?)? validator,
//   }) {
//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Text(
//           labelText,
//           style: TextStyle(
//             color: Colors.grey[800],
//             fontWeight: FontWeight.w500,
//           ),
//         ),
//         const SizedBox(height: 5),
//         TextFormField(
//           controller: controller,
//           obscureText: obscureText,
//           keyboardType: keyboardType,
//           style: const TextStyle(color: Colors.white), // Màu chữ nhập vào
//           decoration: InputDecoration(
//             filled: true,
//             fillColor: Colors.black.withOpacity(0.6), // Nền ô nhập
//             contentPadding: const EdgeInsets.symmetric(
//               horizontal: 15,
//               vertical: 15,
//             ),
//             border: OutlineInputBorder(
//               borderRadius: BorderRadius.circular(10),
//               borderSide: BorderSide.none,
//             ),
//             enabledBorder: OutlineInputBorder(
//               borderRadius: BorderRadius.circular(10),
//               borderSide: BorderSide.none,
//             ),
//             focusedBorder: OutlineInputBorder(
//               borderRadius: BorderRadius.circular(10),
//               borderSide: BorderSide(color: Colors.blue[300]!, width: 1.5),
//             ),
//             errorBorder: OutlineInputBorder(
//               borderRadius: BorderRadius.circular(10),
//               borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
//             ),
//             focusedErrorBorder: OutlineInputBorder(
//               borderRadius: BorderRadius.circular(10),
//               borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
//             ),
//             hintText: 'Enter $labelText',
//             hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
//             suffixIcon: suffixIcon,
//             errorStyle: const TextStyle(
//               color: Colors.redAccent,
//               fontWeight: FontWeight.bold,
//             ),
//           ),
//           validator: validator,
//         ),
//       ],
//     );
//   }
// }
