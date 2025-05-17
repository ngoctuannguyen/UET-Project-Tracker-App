import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_auth/firebase_auth.dart'; // Thêm import này

class AuthService {
  final _storage = const FlutterSecureStorage();
  final FirebaseAuth _firebaseAuth =
      FirebaseAuth.instance; // Thêm instance FirebaseAuth
  static const _tokenKey = 'firebase_id_token';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
    print("AuthService: Token saved successfully.");
  }

  Future<String?> getToken() async {
    String? token = await _storage.read(key: _tokenKey);

    // Kiểm tra xem token có hợp lệ không (ví dụ: kiểm tra thời hạn)
    // Firebase SDK tự động quản lý việc làm mới token khi bạn gọi user.getIdToken(true)
    // Tuy nhiên, nếu bạn muốn chủ động kiểm tra và làm mới:
    User? currentUser = _firebaseAuth.currentUser;
    if (currentUser != null) {
      try {
        // Lấy token mới, SDK sẽ tự làm mới nếu cần
        final String? freshToken = await currentUser.getIdToken(true);
        if (freshToken != null && token != freshToken) {
          print("AuthService: Firebase ID token was refreshed.");
          await saveToken(freshToken); // Lưu token mới
          token = freshToken;
        }
      } catch (e) {
        print(
          "AuthService: Error refreshing token: $e. Using stored token if available.",
        );
        // Nếu không làm mới được, vẫn trả về token đã lưu (nếu có)
        // Hoặc bạn có thể quyết định xóa token và yêu cầu đăng nhập lại
      }
    } else {
      // Nếu không có người dùng hiện tại, token đã lưu có thể không còn hợp lệ
      print(
        "AuthService: No current Firebase user. Stored token might be invalid.",
      );
      // Có thể xóa token ở đây nếu muốn: await deleteToken();
    }

    // print("AuthService: Retrieved token: ${token != null ? 'Exists' : 'Not Found'}");
    return token;
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
    print("AuthService: Token deleted.");
  }
}
