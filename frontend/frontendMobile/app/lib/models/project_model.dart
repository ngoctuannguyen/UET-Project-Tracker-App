// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\models\project_model.dart
class ProjectModel {
  final String productCode;
  final String name;
  final double progress;
  final String status;
  final DateTime? projectDue;
  // Thêm các trường khác nếu cần từ bảng products

  ProjectModel({
    required this.productCode,
    required this.name,
    required this.progress,
    required this.status,
    this.projectDue,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    return ProjectModel(
      productCode: json['productCode'] ?? '',
      name: json['name'] ?? 'Unnamed Project',
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'not started',
      projectDue:
          json['project_due'] != null
              ? DateTime.tryParse(json['project_due'])
              : null,
    );
  }
}
