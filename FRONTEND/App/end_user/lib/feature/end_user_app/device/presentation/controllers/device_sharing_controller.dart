import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';

class DeviceSharingController extends GetxController {
  var sharedUsers = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  late TokenService tokenService;
  String? serialNumber;

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
    serialNumber = Get.arguments['serial_number'];
    if (serialNumber != null) {
      fetchSharedUsers();
    }
  }

  Future<void> fetchSharedUsers() async {
    if (serialNumber == null) return;
    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/getSharedUsers'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${tokenService.getToken()}',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'master_user_id': tokenService.getUserId(),
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          sharedUsers.value = List<Map<String, dynamic>>.from(data['data']);
        }
      }
    } catch (e) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to fetch shared users: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> assignToUser(String phone) async {
    if (serialNumber == null) return;
    
    // Validate phone
    if (phone.length != 10) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Validation Error'),
            content: const Text('Phone number must be exactly 10 digits'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
      return;
    }

    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/assignDeviceToOther'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${tokenService.getToken()}',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'master_user_id': tokenService.getUserId(),
          'shared_to_user_phone': int.parse(phone),
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        Get.dialog(
          Builder(
            builder: (ctx) => AlertDialog(
              title: const Text('Success'),
              content: const Text('Device shared successfully'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(ctx, rootNavigator: true).pop();
                    fetchSharedUsers();
                  },
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      } else {
        String errorMessage = data['message'] ?? 'Failed to share device';
        // Handle "not registered" case with custom message if needed
        if (response.statusCode == 404 && errorMessage.contains('not registered')) {
          errorMessage = 'User not registered. Please ask them to register first.';
        }
        Get.dialog(
          Builder(
            builder: (ctx) => AlertDialog(
              title: const Text('Error'),
              content: Text(errorMessage),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to share device: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateStatus(int sharedToUserId, bool status) async {
    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/updateShareStatus'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${tokenService.getToken()}',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'master_user_id': tokenService.getUserId(),
          'shared_to_user_id': sharedToUserId,
          'status': status,
        }),
      );

      if (response.statusCode == 200) {
        fetchSharedUsers();
      }
    } catch (e) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to update status: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deleteShare(int sharedToUserId) async {
    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/deleteShare'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${tokenService.getToken()}',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'master_user_id': tokenService.getUserId(),
          'shared_to_user_id': sharedToUserId,
        }),
      );

      if (response.statusCode == 200) {
        fetchSharedUsers();
        Get.dialog(
          Builder(
            builder: (ctx) => AlertDialog(
              title: const Text('Success'),
              content: const Text('Share deleted successfully'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to delete share: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> respondToShare(String serial, String action) async {
    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/respondToDeviceShare'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${tokenService.getToken()}',
        },
        body: jsonEncode({
          'serial_number': serial,
          'user_id': tokenService.getUserId(),
          'action': action,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        Get.dialog(
          Builder(
            builder: (ctx) => AlertDialog(
              title: const Text('Success'),
              content: Text('Request $action successfully'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
        if (serialNumber != null) fetchSharedUsers();
        // If it's the current user accepting/rejecting from home, they might need a refresh
      } else {
        Get.dialog(
          Builder(
            builder: (ctx) => AlertDialog(
              title: const Text('Error'),
              content: Text(data['message'] ?? 'Failed to respond to request'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      Get.dialog(
        Builder(
          builder: (ctx) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to respond to request: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx, rootNavigator: true).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
    } finally {
      isLoading.value = false;
    }
  }
}
