// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\models\component_model.dart
class ComponentModel {
  final String componentCode;
  final String name;
  final String isCompleted; // "not started", "in progress", "done"
  final String productCode;
  final String? employeeId;
  final String? productName; // Lấy từ include nếu có

  ComponentModel({
    required this.componentCode,
    required this.name,
    required this.isCompleted,
    required this.productCode,
    this.employeeId,
    this.productName,
  });

  factory ComponentModel.fromJson(Map<String, dynamic> json) {
    return ComponentModel(
      componentCode: json['componentCode'] ?? '',
      name: json['name'] ?? 'Unnamed Component',
      isCompleted: json['is_completed'] ?? 'not started',
      productCode: json['productCode'] ?? '',
      employeeId: json['employeeId'],
      productName: json['Product'] != null ? json['Product']['name'] : null,
    );
  }
}
