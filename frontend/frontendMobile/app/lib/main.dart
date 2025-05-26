// filepath: d:\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\main.dart
import 'package:flutter/material.dart';
import 'package:app/screens/login_screen.dart';
import 'package:app/screens/forgot_password_screen.dart';
import 'package:app/screens/reset_password_screen.dart';
import 'package:firebase_core/firebase_core.dart'; // Đảm bảo đã import
import 'firebase_options.dart'; // Import file cấu hình vừa tạo

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // Đảm bảo Flutter bindings sẵn sàng
  // Sử dụng cấu hình từ firebase_options.dart
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UET Project Tracker',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      debugShowCheckedModeBanner: false,
      onGenerateRoute: (settings) {
        // Kiểm tra xem route có phải là reset-password không
        // settings.name sẽ là '/reset-password?mode=resetPassword&oobCode=XYZ...' khi click link
        if (settings.name != null &&
            settings.name!.startsWith('/reset-password')) {
          final uri = Uri.parse(settings.name!);
          final oobCode =
              uri.queryParameters['oobCode']; // Lấy oobCode từ query params

          if (oobCode != null && oobCode.isNotEmpty) {
            // Nếu có oobCode, điều hướng đến ResetPasswordScreen và truyền code vào
            return MaterialPageRoute(
              builder: (context) => ResetPasswordScreen(oobCode: oobCode),
            );
          } else {
            // Xử lý trường hợp không có oobCode (link lỗi)
            // Có thể điều hướng về login hoặc hiển thị trang lỗi
            print("Lỗi: Không tìm thấy oobCode trong URL reset password.");
            return MaterialPageRoute(
              builder: (context) => const LoginScreen(),
            ); // Ví dụ: về login
          }
        }
        // Nếu không phải route reset-password, trả về null để Flutter xử lý
        // hoặc bạn có thể định nghĩa các route khác ở đây
        // Ví dụ: trả về trang login nếu không khớp route nào
        return MaterialPageRoute(builder: (context) => const LoginScreen());
      },
      home: const LoginScreen(), // Màn hình mặc định khi mở ứng dụng
    );
  }
}
