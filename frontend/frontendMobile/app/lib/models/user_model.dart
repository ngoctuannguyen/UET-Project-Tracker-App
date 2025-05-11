import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class UserModel {
  final String
  docId; // <<< THÊM: ID của document Firestore (ví dụ: 'user1', 'user2')
  final String userId; // Giá trị của field 'user_id'
  final String fullName;
  final String email;
  final String? gender;
  final DateTime? birthday;
  final String? role;
  // final String? avatarUrl;

  UserModel({
    required this.docId, // <<< THÊM vào constructor
    required this.userId,
    required this.fullName,
    required this.email,
    this.gender,
    this.birthday,
    this.role,
    // this.avatarUrl,
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

    DateTime? birthDate;
    if (data['birthday'] != null && data['birthday'] is Timestamp) {
      birthDate = (data['birthday'] as Timestamp).toDate();
    }

    return UserModel(
      docId: doc.id, // <<< LƯU Document ID thực tế
      userId: data['user_id'] ?? doc.id, // Ưu tiên field 'user_id'
      fullName: data['full_name'] ?? 'Chưa cập nhật',
      email: data['email'] ?? 'Chưa cập nhật',
      gender: data['gender'],
      birthday: birthDate,
      role: data['role'],
      // avatarUrl: data['avatarUrl'],
    );
  }

  String get birthdayFormatted {
    if (birthday == null) return 'Chưa cập nhật';
    try {
      return DateFormat('dd/MM/yyyy').format(birthday!);
    } catch (e) {
      print("Error formatting date: $e");
      return 'Ngày không hợp lệ';
    }
  }

  Map<String, dynamic> toFirestore() {
    return {
      'full_name': fullName,
      'email': email,
      'gender': gender,
      'birthday': birthday != null ? Timestamp.fromDate(birthday!) : null,
      // Không cập nhật docId, userId, role từ màn hình này
    };
  }
}
