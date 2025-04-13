import 'package:flutter/material.dart';
// Import file màn hình home bạn vừa tạo
import 'package:app/screens/home_screen.dart'; // Thay 'app' bằng tên package của bạn (xem trong pubspec.yaml)

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App Quản Lý Công Việc', // Đặt tên App của bạn
      theme: ThemeData(
        primarySwatch: Colors.blue, // Bạn có thể giữ hoặc đổi theme
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      // Sử dụng HomeScreen làm màn hình chính
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false, // Ẩn banner debug
    );
  }
}

// Bạn có thể xóa class MyHomePage mặc định nếu không dùng đến nữa
// class MyHomePage extends StatefulWidget { ... }
// class _MyHomePageState extends State<MyHomePage> { ... }
