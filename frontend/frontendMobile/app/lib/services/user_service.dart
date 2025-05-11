import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:app/models/user_model.dart'; // Đảm bảo import UserModel

class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String _collectionPath = 'user_service';

  /// Lấy UserModel dựa trên Firebase Auth UID (nay là Document ID).
  ///
  /// [authUid] chính là Document ID của người dùng trong collection 'user_service'.
  Future<UserModel?> getUserByAuthUid(String authUid) async {
    if (authUid.isEmpty) {
      print('Error: authUid (Document ID) cannot be empty.');
      return null;
    }
    try {
      // Truy cập trực tiếp document bằng authUid (vì authUid là Document ID)
      DocumentSnapshot docSnapshot =
          await _firestore.collection(_collectionPath).doc(authUid).get();

      if (docSnapshot.exists) {
        // Trả về UserModel từ document tìm thấy
        return UserModel.fromFirestore(docSnapshot);
      } else {
        print(
          'Không tìm thấy user trong $_collectionPath với authUid (docId): $authUid',
        );
        return null;
      }
    } catch (e) {
      print('Lỗi khi lấy user bằng authUid (docId) $authUid: $e');
      return null;
    }
  }

  /// Lấy thông tin user dựa trên giá trị của field 'user_id' (ví dụ: 'VNU1', 'VNU2').
  ///
  /// Đây là một query dựa trên một trường cụ thể, không phải Document ID.
  Future<UserModel?> getUserByUserIdField(String userIdValue) async {
    if (userIdValue.isEmpty) {
      print('Error: userIdValue for field query cannot be empty.');
      return null;
    }
    try {
      QuerySnapshot querySnapshot =
          await _firestore
              .collection(_collectionPath)
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
      print('Error fetching user by user_id field $userIdValue: $e');
      return null;
    }
  }

  /// Lấy UserModel dựa trên Document ID.
  ///
  /// Với cấu trúc mới,  sẽ chính là `authUid`.
  /// Hàm này có logic tương tự như `getUserByAuthUid` và có thể được coi là một alias.
  Future<UserModel?> getUserByDocId(String docId) async {
    if (docId.isEmpty) {
      print('Error: docId cannot be empty.');
      return null;
    }
    // Logic này giống hệt getUserByAuthUid vì docId chính là authUid
    return getUserByAuthUid(docId);
  }

  /// Cập nhật thông tin user dựa trên Document ID.
  ///
  /// Với cấu trúc mới, [docIdToUpdate] sẽ chính là `authUid`.
  Future<bool> updateUser(
    String docIdToUpdate, // Đây chính là authUid
    Map<String, dynamic> data,
  ) async {
    if (docIdToUpdate.isEmpty) {
      print('Error: docIdToUpdate (authUid) cannot be empty for update.');
      return false;
    }
    try {
      await _firestore
          .collection(_collectionPath)
          .doc(docIdToUpdate) // Sử dụng Document ID (chính là authUid)
          .update(data);
      print('User updated successfully (docId: $docIdToUpdate)');
      return true;
    } catch (e) {
      print('Error updating user (docId: $docIdToUpdate): $e');
      return false;
    }
  }
}
