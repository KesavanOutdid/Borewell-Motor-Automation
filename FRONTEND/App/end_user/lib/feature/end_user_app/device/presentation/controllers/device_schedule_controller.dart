import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../utils/ui_utils.dart';

class DeviceScheduleController extends GetxController {
  final tokenService = Get.find<TokenService>();
  
  var isLoading = false.obs;
  var schedules = <Map<String, dynamic>>[].obs;
  var selectedStatus = 'All'.obs;
  
  late String serialNumber;
  late String imeiNumber;

  void _showErrorDialog(String message) {
    if (Get.context == null) return;
    showDialog(
      context: Get.context!,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red),
            SizedBox(width: 10),
            Text('Error'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
  
  void initialize(Map<String, dynamic> args) {
    serialNumber = args['serial_number'] ?? '';
    imeiNumber = args['imei_number'] ?? '';
    fetchSchedules();
  }

  Future<void> fetchSchedules() async {
    isLoading.value = true;
    try {
      final token = tokenService.getToken();
      String url = '${AppConfig.baseUrl}/app/getSchedules?serial_number=$serialNumber';
      if (selectedStatus.value != 'All') {
        url += '&status=${selectedStatus.value.toLowerCase()}';
      }
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          schedules.assignAll(List<Map<String, dynamic>>.from(data['data']));
        }
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      }
    } catch (e) {
      print('Error fetching schedules: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> createSchedule(DateTime start, DateTime stop) async {
    isLoading.value = true;
    try {
      final token = tokenService.getToken();
      final userId = tokenService.getUserId();
      final userName = tokenService.getUserName();
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/createSchedule'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'imei_number': imeiNumber,
          'user_id': userId,
          'user_name': userName,
          'start_time': start.toUtc().toIso8601String(),
          'stop_time': stop.toUtc().toIso8601String(),
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 201 && data['success']) {
        if (Get.context != null) {
          showDialog(
            context: Get.context!,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 10),
                  Text('Success'),
                ],
              ),
              content: const Text('Motor schedule has been created successfully.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
        }
        fetchSchedules();
        return true;
      } else if (response.statusCode == 403) {
        _handleDeactivated();
        return false;
      } else {
        _showErrorDialog(data['message'] ?? 'Failed to create schedule');
        return false;
      }
    } catch (e) {
      print('Create schedule error: $e');
      _showErrorDialog('Connection failed: $e');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> cancelSchedule(String scheduleId) async {
    try {
      final token = tokenService.getToken();
      final userName = tokenService.getUserName();
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/cancelSchedule/$scheduleId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'user_name': userName,
        }),
      );

      if (response.statusCode == 200) {
        if (Get.context != null) {
          showDialog(
            context: Get.context!,
            builder: (context) => AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 10),
                  Text('Cancelled'),
                ],
              ),
              content: const Text('Schedule has been cancelled successfully.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
        }
        fetchSchedules();
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      }
    } catch (e) {
      print('Error cancelling schedule: $e');
    }
  }

  void _handleDeactivated() {
    UIUtils.handleAccountDeactivated();
  }
}
