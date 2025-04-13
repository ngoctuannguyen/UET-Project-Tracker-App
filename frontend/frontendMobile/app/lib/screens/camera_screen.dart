import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' show join;
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
// <<< THAY ĐỔI IMPORT: Trỏ đến màn hình kết quả tìm kiếm >>>
import 'package:app/screens/image_search_result_screen.dart';
// import 'package:app/screens/general_chat_screen.dart';
// import 'package:app/screens/settings_screen.dart';
import 'package:app/screens/chatbot_screen.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  CameraDescription? _frontCamera;
  CameraDescription? _backCamera;
  bool _isUsingFrontCamera = true; // Mặc định dùng camera trước
  Future<void>? _initializeControllerFuture;
  int _selectedIndex = 2; // Index của tab Camera là 2

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  // Helper function to find a camera by lens direction
  CameraDescription? _findCamera(
    List<CameraDescription>? cameras,
    CameraLensDirection direction,
  ) {
    if (cameras == null) return null;
    try {
      return cameras.firstWhere((camera) => camera.lensDirection == direction);
    } catch (e) {
      // firstWhere throws StateError if no element is found
      return null;
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();

      // Tìm camera trước và sau using the helper method
      _frontCamera = _findCamera(_cameras, CameraLensDirection.front);
      _backCamera = _findCamera(_cameras, CameraLensDirection.back);

      // Ưu tiên dùng camera trước nếu có, không thì dùng camera sau
      CameraDescription? initialCamera = _frontCamera ?? _backCamera;
      _isUsingFrontCamera = (initialCamera == _frontCamera);

      if (initialCamera != null) {
        await _initCameraController(initialCamera);
      } else {
        print("Không tìm thấy camera nào.");
        // Xử lý trường hợp không có camera (ví dụ: hiển thị thông báo)
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Không tìm thấy camera nào trên thiết bị.'),
            ),
          );
        }
      }
    } catch (e) {
      print("Lỗi khi lấy danh sách camera: $e");
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi khi truy cập camera: $e')));
      }
    }
  }

  Future<void> _initCameraController(
    CameraDescription cameraDescription,
  ) async {
    if (_controller != null) {
      await _controller!.dispose();
    }

    _controller = CameraController(
      cameraDescription,
      ResolutionPreset.high,
      enableAudio: false,
    );

    _controller!.addListener(() {
      if (mounted) setState(() {});
      if (_controller!.value.hasError) {
        print('Lỗi Camera: ${_controller!.value.errorDescription}');
        // Hiển thị lỗi cho người dùng nếu cần
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Lỗi Camera: ${_controller!.value.errorDescription}',
              ),
            ),
          );
        }
      }
    });

    try {
      _initializeControllerFuture = _controller!.initialize();
      if (mounted) {
        setState(() {});
      }
    } on CameraException catch (e) {
      print(
        'Lỗi khi khởi tạo camera: ${e.code}\nError Message: ${e.description}',
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khởi tạo camera: ${e.description}')),
        );
      }
    } catch (e) {
      print('Lỗi không xác định khi khởi tạo camera: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi không xác định khi khởi tạo camera: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  // <<< HÀM NÀY ĐÃ ĐƯỢC CẬP NHẬT ĐIỀU HƯỚNG >>>
  Future<void> _takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      print('Lỗi: Controller chưa sẵn sàng.');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Camera chưa sẵn sàng.')));
      }
      return;
    }
    if (_controller!.value.isTakingPicture) {
      return; // Tránh chụp nhiều ảnh cùng lúc
    }

    try {
      await _initializeControllerFuture; // Đảm bảo khởi tạo xong

      XFile imageFile = await _controller!.takePicture();
      print('Ảnh đã được chụp: ${imageFile.path}');

      // <<< THAY ĐỔI ĐIỀU HƯỚNG: Sang ImageSearchResultScreen >>>
      if (mounted) {
        // Kiểm tra mounted trước khi điều hướng
        Navigator.push(
          context,
          MaterialPageRoute(
            // Sử dụng ImageSearchResultScreen thay vì ReportScreen
            builder:
                (context) => ImageSearchResultScreen(imagePath: imageFile.path),
          ),
        );
      }
    } on CameraException catch (e) {
      print("Lỗi CameraException khi chụp ảnh: ${e.code} - ${e.description}");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi chụp ảnh: ${e.description}')),
        );
      }
    } catch (e) {
      print("Lỗi không xác định khi chụp ảnh: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi không xác định khi chụp ảnh: $e')),
        );
      }
    }
  }

  Future<void> _switchCamera() async {
    final bool canSwitch = _frontCamera != null && _backCamera != null;
    if (!canSwitch ||
        _controller == null ||
        !_controller!.value.isInitialized) {
      print("Không thể chuyển camera.");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể chuyển camera.')),
        );
      }
      return;
    }

    CameraDescription newCamera =
        _isUsingFrontCamera ? _backCamera! : _frontCamera!;
    setState(() {
      _isUsingFrontCamera = !_isUsingFrontCamera;
      _initializeControllerFuture = null; // Hiển thị loading khi chuyển
    });
    await _initCameraController(newCamera);
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;

    // Không cần setState vì dùng pushReplacement
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const FriendsListScreen()),
        );
        break;
      case 2: // Camera (đang ở đây)
        break; // Không làm gì vì đang ở màn hình Camera
      case 3: // Chat Bot
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const ChatbotScreen(),
          ), // Điều hướng đến ChatbotScreen
        );
        break;
      case 4: // Settings
        print('Navigate to Settings Screen');
        // Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => SettingsScreen()));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool canSwitchCamera = _frontCamera != null && _backCamera != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chụp ảnh báo cáo'),
        backgroundColor: Colors.blueAccent,
        actions: [
          if (canSwitchCamera)
            IconButton(
              icon: Icon(
                _isUsingFrontCamera ? Icons.camera_rear : Icons.camera_front,
              ),
              onPressed: _switchCamera,
              tooltip: 'Chuyển camera',
            ),
        ],
      ),
      body: FutureBuilder<void>(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          // Kiểm tra lỗi trong snapshot trước
          if (snapshot.hasError) {
            print("Lỗi FutureBuilder: ${snapshot.error}");
            return Center(
              child: Text('Lỗi khởi tạo camera: ${snapshot.error}'),
            );
          }

          // Kiểm tra trạng thái kết nối
          if (snapshot.connectionState == ConnectionState.done) {
            // Kiểm tra controller và giá trị của nó sau khi future done
            if (_controller != null && _controller!.value.isInitialized) {
              return Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  Center(
                    child: AspectRatio(
                      aspectRatio: _controller!.value.aspectRatio,
                      child: CameraPreview(_controller!),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 30.0),
                    child: FloatingActionButton(
                      onPressed: _takePicture, // Gọi hàm đã cập nhật
                      child: const Icon(Icons.camera_alt),
                    ),
                  ),
                ],
              );
            } else {
              // Trường hợp future done nhưng controller không hợp lệ
              return const Center(
                child: Text(
                  'Không thể khởi tạo camera. Vui lòng kiểm tra quyền truy cập.',
                ),
              );
            }
          } else {
            // Hiển thị loading khi đang chờ future hoàn thành
            return const Center(child: CircularProgressIndicator());
          }
        },
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.group_outlined),
            activeIcon: Icon(Icons.group),
            label: 'Nhóm',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt_outlined),
            activeIcon: Icon(Icons.camera_alt),
            label: 'Camera',
          ),
          BottomNavigationBarItem(
            // <<< THAY ĐỔI ICON >>>
            icon: Icon(Icons.smart_toy_outlined), // Icon chatbot chưa chọn
            activeIcon: Icon(Icons.smart_toy), // Icon chatbot đã chọn
            label: 'Chatbot', // Đổi label nếu muốn
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        backgroundColor: Colors.white,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        elevation: 8.0,
      ),
    );
  }
}
