// filepath: d:\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\screens\camera_screen.dart
import 'dart:io';
import 'dart:typed_data'; // <<< THÊM: Import Uint8List
import 'package:flutter/foundation.dart' show kIsWeb;
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
import 'package:image/image.dart' as img; // Import thư viện image
import 'package:app/screens/manual_barcode_screen.dart'; // <<< THÊM: Import màn hình mới

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
  bool _isUsingFrontCamera =
      true; // Giả sử bạn có biến này để theo dõi camera đang dùng
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
      print('Đang trong quá trình chụp ảnh khác.');
      return;
    }

    try {
      // Đảm bảo controller đã sẵn sàng hoàn toàn
      await _initializeControllerFuture;
      print("Controller initialized, proceeding to take picture.");

      XFile imageFile = await _controller!.takePicture();
      String originalPath = imageFile.path;
      String processedPath = originalPath; // Mặc định là đường dẫn gốc

      print("Ảnh gốc được lưu tại: $originalPath");
      print(
        "Lens direction của camera hiện tại: ${_controller!.description.lensDirection}",
      );
      print("Biến _isUsingFrontCamera: $_isUsingFrontCamera");

      // Điều kiện để lật ảnh: CHỈ LẬT KHI KHÔNG PHẢI WEB VÀ LÀ CAMERA TRƯỚC
      bool shouldFlip =
          !kIsWeb &&
          (_controller!.description.lensDirection ==
                  CameraLensDirection.front ||
              _isUsingFrontCamera);

      print("Có nên lật ảnh không? (Dựa trên !kIsWeb): $shouldFlip");

      if (shouldFlip) {
        // Logic lật bằng thư viện 'image' chỉ chạy cho mobile
        print("Đang tiến hành lật ảnh (Mobile)...");
        final File rawImageFile = File(originalPath);
        if (!await rawImageFile.exists()) {
          print("Lỗi: File ảnh gốc không tồn tại tại $originalPath");
          // Xử lý lỗi nếu file không tồn tại, có thể hiển thị thông báo
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lỗi: Không tìm thấy file ảnh gốc.'),
              ),
            );
          }
          return; // Không tiếp tục nếu không có file
        }

        Uint8List imageBytes = await rawImageFile.readAsBytes();
        img.Image? originalImage = img.decodeImage(imageBytes);

        if (originalImage != null) {
          print("Ảnh gốc đã được decode thành công.");
          img.Image flippedImage = img.flipHorizontal(originalImage);
          print("Ảnh đã được lật trong bộ nhớ.");

          final Directory extDir = await getTemporaryDirectory();
          final String newPath = join(
            extDir.path,
            '${DateTime.now().millisecondsSinceEpoch}_flipped.jpg',
          );

          // Ghi file đã lật
          await File(newPath).writeAsBytes(
            img.encodeJpg(flippedImage, quality: 90),
          ); // quality có thể điều chỉnh
          processedPath = newPath;
          print('Ảnh đã lật và lưu tại: $processedPath');

          // (Tùy chọn) Kiểm tra xem file mới có tồn tại không
          if (await File(processedPath).exists()) {
            print("File ảnh đã lật tồn tại trên disk.");
          } else {
            print("Lỗi: File ảnh đã lật KHÔNG tồn tại trên disk sau khi ghi.");
          }
        } else {
          print("Lỗi: Không thể decode ảnh gốc. originalImage is null.");
          // Giữ nguyên processedPath là originalPath nếu không decode được
        }
      } else {
        if (kIsWeb) {
          print(
            "Không lật ảnh bằng thư viện 'image' (vì đang chạy trên Web). Sẽ xử lý hiển thị sau nếu cần.",
          );
        } else {
          print(
            "Không lật ảnh (Mobile - không phải camera trước hoặc điều kiện không thỏa mãn).",
          );
        }
      }

      if (mounted) {
        print("Điều hướng đến ImageSearchResultScreen với ảnh: $processedPath");
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => ImageSearchResultScreen(
                  imagePath: processedPath, // Vẫn là ảnh gốc nếu là web
                  currentUser: widget.currentUser,
                  // Thêm một cờ để báo cho ImageSearchResultScreen biết là ảnh từ camera trước trên web
                  isFromFrontCameraOnWeb:
                      kIsWeb &&
                      (_controller!.description.lensDirection ==
                              CameraLensDirection.front ||
                          _isUsingFrontCamera),
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
    } catch (e, stackTrace) {
      // Thêm stackTrace để debug dễ hơn
      print("Lỗi không xác định khi chụp ảnh: $e");
      print("Stack trace: $stackTrace");
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
        automaticallyImplyLeading: false,
        actions: [
          // <<< THÊM: Nút để nhập barcode thủ công >>>
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder:
                      (context) =>
                          ManualBarcodeScreen(currentUser: widget.currentUser),
                ),
              );
            },
            child: const Text(
              'Hoặc nhập mã',
              style: TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
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
