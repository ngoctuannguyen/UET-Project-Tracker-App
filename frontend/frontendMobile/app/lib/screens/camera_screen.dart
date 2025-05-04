// filepath: d:\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\screens\camera_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' show join;
import 'package:app/screens/home_screen.dart';
import 'package:app/screens/friends_list_screen.dart';
import 'package:app/screens/image_search_result_screen.dart';
import 'package:app/screens/chatbot_screen.dart';
import 'package:app/screens/settings_screen.dart';
import 'package:app/models/user_model.dart'; // <<< THÊM: Import UserModel

class CameraScreen extends StatefulWidget {
  // <<< THÊM: Nhận currentUser (có thể null nếu không bắt buộc) >>>
  final UserModel? currentUser;

  const CameraScreen({Key? key, this.currentUser}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  CameraDescription? _frontCamera;
  CameraDescription? _backCamera;
  bool _isUsingFrontCamera = true;
  Future<void>? _initializeControllerFuture;
  int _selectedIndex = 2;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    // In ra để kiểm tra currentUser có được truyền vào không
    print(
      'CameraScreen initState: currentUser is ${widget.currentUser?.fullName}',
    );
  }

  // ... (Các hàm _findCamera, _initializeCamera, _initCameraController giữ nguyên) ...
  CameraDescription? _findCamera(
    List<CameraDescription>? cameras,
    CameraLensDirection direction,
  ) {
    if (cameras == null) return null;
    try {
      return cameras.firstWhere((camera) => camera.lensDirection == direction);
    } catch (e) {
      return null;
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      _frontCamera = _findCamera(_cameras, CameraLensDirection.front);
      _backCamera = _findCamera(_cameras, CameraLensDirection.back);
      CameraDescription? initialCamera = _frontCamera ?? _backCamera;
      _isUsingFrontCamera = (initialCamera == _frontCamera);

      if (initialCamera != null) {
        await _initCameraController(initialCamera);
      } else {
        print("Không tìm thấy camera nào.");
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
      return;
    }

    try {
      await _initializeControllerFuture;

      XFile imageFile = await _controller!.takePicture();
      print('Ảnh đã được chụp: ${imageFile.path}');

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            // <<< SỬA: Truyền currentUser sang ImageSearchResultScreen nếu cần >>>
            builder:
                (context) => ImageSearchResultScreen(
                  imagePath: imageFile.path,
                  currentUser: widget.currentUser, // Truyền currentUser
                ),
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
      _initializeControllerFuture = null;
    });
    await _initCameraController(newCamera);
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index || widget.currentUser == null) {
      // Không điều hướng nếu nhấn tab hiện tại hoặc currentUser là null
      if (widget.currentUser == null) {
        print(
          "Lỗi: currentUser là null, không thể điều hướng từ CameraScreen.",
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Lỗi thông tin người dùng, không thể chuyển màn hình.',
            ),
          ),
        );
      }
      return;
    }

    // <<< SỬA: Truyền widget.currentUser! (đã kiểm tra null) >>>
    switch (index) {
      case 0: // Home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 1: // Nhóm
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) =>
                    FriendsListScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 2: // Camera (đang ở đây)
        break;
      case 3: // Chat Bot
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => ChatbotScreen(currentUser: widget.currentUser!),
          ),
        );
        break;
      case 4: // Settings
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) => SettingsScreen(currentUser: widget.currentUser!),
          ),
        );
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
        automaticallyImplyLeading: false, // Ẩn nút back mặc định
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
          if (snapshot.hasError) {
            print("Lỗi FutureBuilder: ${snapshot.error}");
            return Center(
              child: Text('Lỗi khởi tạo camera: ${snapshot.error}'),
            );
          }

          if (snapshot.connectionState == ConnectionState.done) {
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
                      onPressed: _takePicture,
                      child: const Icon(Icons.camera_alt),
                    ),
                  ),
                ],
              );
            } else {
              return const Center(
                child: Text(
                  'Không thể khởi tạo camera. Vui lòng kiểm tra quyền truy cập.',
                  textAlign: TextAlign.center,
                ),
              );
            }
          } else {
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
            icon: Icon(Icons.smart_toy_outlined),
            activeIcon: Icon(Icons.smart_toy),
            label: 'Chatbot',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Cài đặt',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onItemTapped, // <<< SỬA: Gọi hàm đã cập nhật >>>
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
