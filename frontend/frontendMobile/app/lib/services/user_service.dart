import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:app/models/user_model.dart'; // Đảm bảo import UserModel

class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // <<< SỬA: Chỉ cần đường dẫn collection chính >>>
  final String _collectionPath = 'user_service';

  // <<< THÊM HÀM: Lấy UserModel dựa trên Firebase Auth UID >>>
  Future<UserModel?> getUserByAuthUid(String authUid) async {
    try {
      QuerySnapshot querySnapshot =
          await _firestore
              .collection(_collectionPath) // Query collection 'user_service'
              .where('authUid', isEqualTo: authUid) // Query field 'authUid'
              .limit(1)
              .get();

      if (querySnapshot.docs.isNotEmpty) {
        // Trả về UserModel từ document tìm thấy
        return UserModel.fromFirestore(querySnapshot.docs.first);
      } else {
        print(
          'Không tìm thấy user trong $_collectionPath với authUid: $authUid',
        );
        return null;
      }
    } catch (e) {
      print('Lỗi khi lấy user bằng authUid: $e');
      return null;
    }
  }

  // Lấy thông tin user dựa trên field 'user_id' ('VNU1', 'VNU2', ...)
  Future<UserModel?> getUserByUserIdField(String userIdValue) async {
    try {
      // <<< SỬA: Query trực tiếp trên collection _collectionPath >>>
      QuerySnapshot querySnapshot =
          await _firestore
              .collection(_collectionPath) // Query collection 'user_service'
              .where('user_id', isEqualTo: userIdValue) // Query field 'user_id'
              .limit(1)
              .get();

      if (querySnapshot.docs.isNotEmpty) {
        return UserModel.fromFirestore(querySnapshot.docs.first);
      } else {
        print(
          'User not found with user_id field: $userIdValue in collection $_collectionPath',
        );
        return null;
      }
    } catch (e) {
      print('Error fetching user by user_id field: $e');
      return null;
    }
  }

  // <<< THÊM HÀM: Lấy UserModel dựa trên Document ID ('user1', 'user2') >>>
  Future<UserModel?> getUserByDocId(String docId) async {
    try {
      DocumentSnapshot docSnapshot =
          await _firestore
              .collection(_collectionPath) // Collection 'user_service'
              .doc(docId) // Lấy document bằng ID ('user1', 'user2')
              .get();

      if (docSnapshot.exists) {
        return UserModel.fromFirestore(docSnapshot);
      } else {
        print(
          'User not found with docId: $docId in collection $_collectionPath',
        );
        return null;
      }
    } catch (e) {
      print('Error fetching user by docId: $e');
      return null;
    }
  }

  // Cập nhật thông tin user dựa trên Document ID ('user1', 'user2', ...)
  Future<bool> updateUser(
    String docIdToUpdate,
    Map<String, dynamic> data,
  ) async {
    try {
      // <<< SỬA: Update trực tiếp document trong collection _collectionPath >>>
      await _firestore
          .collection(_collectionPath) // Collection 'user_service'
          .doc(docIdToUpdate) // Sử dụng Document ID ('user1', 'user2')
          .update(data);
      print('User updated successfully (docId: $docIdToUpdate)');
      return true;
    } catch (e) {
      print('Error updating user (docId: $docIdToUpdate): $e');
      return false;
    }
  }
}
