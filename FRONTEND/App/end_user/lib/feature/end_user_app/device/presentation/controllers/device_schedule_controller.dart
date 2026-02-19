import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';

class DeviceScheduleController extends GetxController {
  final tokenService = Get.find<TokenService>();
  
  var isLoading = false.obs;
  var schedules = <Map<String, dynamic>>[].obs;
  
  late String serialNumber;
  late String imeiNumber;
  
  void initialize(Map<String, dynamic> args) {
    serialNumber = args['serial_number'] ?? '';
    imeiNumber = args['imei_number'] ?? '';
    fetchSchedules();
  }

  Future<void> fetchSchedules() async {
    isLoading.value = true;
    try {
      final token = tokenService.getToken();
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/app/getSchedules?serial_number=$serialNumber'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          schedules.assignAll(List<Map<String, dynamic>>.from(data['data']));
        }
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
          'start_time': start.toIso8601String(),
          'stop_time': stop.toIso8601String(),
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 201 && data['success']) {
        Get.snackbar('Success', 'Schedule created successfully', 
          backgroundColor: Colors.green, colorText: Colors.white);
        fetchSchedules();
        return true;
      } else {
        Get.snackbar('Error', data['message'] ?? 'Failed to create schedule',
          backgroundColor: Colors.red, colorText: Colors.white);
        return false;
      }
    } catch (e) {
      Get.snackbar('Error', 'Connection failed',
          backgroundColor: Colors.red, colorText: Colors.white);
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
        Get.snackbar('Success', 'Schedule cancelled',
          backgroundColor: Colors.green, colorText: Colors.white);
        fetchSchedules();
      }
    } catch (e) {
      print('Error cancelling schedule: $e');
    }
  }
}
