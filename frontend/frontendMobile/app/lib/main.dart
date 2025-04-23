import 'package:flutter/material.dart';
// import 'package:firebase_core/firebase_core.dart'; // Import Firebase Core
import 'package:app/screens/login_screen.dart';
// Bạn có thể giữ lại các import khác nếu cần dùng sau này
// import 'package:app/screens/forgot_password_screen.dart';
// import 'package:app/screens/reset_password_screen.dart';
// import 'firebase_options.dart'; // Nếu bạn dùng FlutterFire CLI

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Khởi tạo Firebase
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform, // Nếu dùng FlutterFire CLI
  // );
  // await Firebase.initializeApp(); // Hoặc cách khởi tạo cũ nếu bạn không dùng CLI
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
      // Chỉ định màn hình khởi đầu bằng thuộc tính 'home'
      home: const LoginScreen(),
      // Không dùng initialRoute và onGenerateRoute trong phiên bản đơn giản này
      // initialRoute: '/',
      // onGenerateRoute: (settings) { ... },
    );
  }
}
