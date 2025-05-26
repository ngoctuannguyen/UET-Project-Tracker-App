// filepath: d:\FEManagentToUpdateChatandReportService\codefixFE\UET-Project-Tracker-App\frontend\frontendMobile\app\lib\services\project_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:app/models/project_model.dart';
import 'package:app/models/component_model.dart';
import 'package:app/services/auth_service.dart'; // Để lấy token

class ProjectService {
  // THAY THẾ BẰNG URL CỦA REPORT SERVICE CỦA BẠN
  static const String _reportServiceBaseUrl =
      'http://localhost:3004/api'; // Ví dụ port 3003
  final AuthService _authService = AuthService();

  Future<List<ProjectModel>> getProjectsForEmployee(String employeeId) async {
    final token = await _authService.getToken();
    if (token == null) {
      throw Exception('User not authenticated');
    }

    final url = Uri.parse(
      '$_reportServiceBaseUrl/projects/employee/$employeeId',
    );
    print('Fetching projects from: $url');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        List<dynamic> body = jsonDecode(response.body);
        List<ProjectModel> projects =
            body
                .map(
                  (dynamic item) =>
                      ProjectModel.fromJson(item as Map<String, dynamic>),
                )
                .toList();
        return projects;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        await _authService.deleteToken(); // Token hết hạn hoặc không hợp lệ
        throw Exception('Authentication failed. Please login again.');
      } else {
        print(
          'Failed to load projects: ${response.statusCode} ${response.body}',
        );
        throw Exception(
          'Failed to load projects. Status: ${response.statusCode}',
        );
      }
    } catch (e) {
      print('Error fetching projects: $e');
      throw Exception('Error fetching projects: $e');
    }
  }

  Future<List<ComponentModel>> getComponentsForProjectByEmployee(
    String productCode,
    String employeeId,
  ) async {
    final token = await _authService.getToken();
    if (token == null) {
      throw Exception('User not authenticated');
    }

    final url = Uri.parse(
      '$_reportServiceBaseUrl/projects/$productCode/employee/$employeeId/components',
    );
    print('Fetching components from: $url');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        List<dynamic> body = jsonDecode(response.body);
        List<ComponentModel> components =
            body
                .map(
                  (dynamic item) =>
                      ComponentModel.fromJson(item as Map<String, dynamic>),
                )
                .toList();
        return components;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        await _authService.deleteToken();
        throw Exception('Authentication failed. Please login again.');
      } else {
        print(
          'Failed to load components: ${response.statusCode} ${response.body}',
        );
        throw Exception(
          'Failed to load components. Status: ${response.statusCode}',
        );
      }
    } catch (e) {
      print('Error fetching components: $e');
      throw Exception('Error fetching components: $e');
    }
  }
}
