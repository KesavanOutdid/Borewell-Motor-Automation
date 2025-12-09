import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../device/presentation/pages/qr_scanner_page.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class HomeController extends GetxController {
  var devices = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  late TokenService tokenService;
  final _storage = GetStorage();

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  @override
  void onReady() {
    super.onReady();
    fetchDevices();
  }

  Future<void> fetchDevices() async {
    isLoading.value = true;

    final url = Uri.parse(AppConfig.baseUrl + AppConfig.userAssignedDevicesEndpoint);
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "user_id": userId,
        }),
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        if (jsonData['success'] == true && jsonData['data'] != null) {
          devices.value = List<Map<String, dynamic>>.from(jsonData['data']);
          await _storage.write('assigned_devices', devices);
        } else {
          devices.value = [];
          await _storage.write('assigned_devices', []);
        }
      } else if (response.statusCode == 401) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar("Error", "Session expired. Please login again");
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          Get.offAllNamed('/login');
        });
      } else if (response.statusCode == 404) {
        devices.value = [];
      } else {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar("Error", "Failed to fetch devices");
        });
      }
    } catch (e) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar("Error", "Connection failed: $e");
      });
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> toggleDevice(String deviceId, bool status) async {
    try {
      final url = Uri.parse(AppConfig.baseUrl + AppConfig.deviceEndpoint);
      final token = tokenService.getToken();

      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "device_id": deviceId,
          "status": status ? "ON" : "OFF",
        }),
      );

      if (response.statusCode == 200) {
        Future.delayed(Duration.zero, () {
          Get.snackbar("Success", "Device toggled");
        });
        fetchDevices();
      } else if (response.statusCode == 401) {
        Get.offAllNamed('/login');
        Future.delayed(Duration.zero, () {
          Get.snackbar("Error", "Session expired. Please login again");
        });
      } else {
        Future.delayed(Duration.zero, () {
          Get.snackbar("Error", "Failed to toggle device");
        });
      }
    } catch (e) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Connection failed: $e");
      });
    }
  }

  Future<void> assignDevice(String serialNumber) async {
    print('🔷 ==========================================');
    print('🔷 ASSIGN DEVICE API CALL START');
    print('🔷 ==========================================');
    
    final url = Uri.parse(AppConfig.baseUrl + AppConfig.deviceAssignToUserEndpoint);
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();
    final userName = tokenService.getUserName();
    final userEmail = tokenService.getUserEmail();

    print('📍 URL: $url');
    print('📍 Serial Number: $serialNumber');
    print('📍 User ID: $userId');
    print('📍 User Name: $userName');
    print('📍 User Email: $userEmail');
    print('📍 Token: ${token?.substring(0, 20)}...');

    if (serialNumber.isEmpty) {
      print('❌ Serial number is empty');
      Get.snackbar("Error", "Serial number is required");
      return;
    }

    final requestBody = {
      "serial_number": serialNumber,
      "user_id": userId,
      "assignedBy": userEmail,
    };
    
    print('📤 Request Body: ${jsonEncode(requestBody)}');

    try {
      print('🌐 Making HTTP POST request...');
      
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode(requestBody),
      );

      print('📥 Response Status Code: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Device assigned successfully');
        final jsonData = jsonDecode(response.body);
        Get.back();
        Get.snackbar(
          "Success",
          jsonData['message'] ?? "Device assigned successfully",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green[100],
          duration: const Duration(seconds: 3),
        );
        await fetchDevices();
      } else if (response.statusCode == 401) {
        print('❌ Unauthorized - Session expired');
        Get.offAllNamed('/login');
        Get.snackbar("Error", "Session expired. Please login again");
      } else if (response.statusCode == 404) {
        print('❌ Device not found');
        Get.snackbar("Error", "Device not found");
      } else if (response.statusCode == 400) {
        print('❌ Bad request');
        final jsonData = jsonDecode(response.body);
        Get.snackbar("Error", jsonData['message'] ?? "Invalid request");
      } else {
        print('❌ Failed with status: ${response.statusCode}');
        final jsonData = jsonDecode(response.body);
        Get.snackbar("Error", jsonData['message'] ?? "Failed to assign device");
      }
    } catch (e, stackTrace) {
      print('❌ Exception occurred: $e');
      print('❌ Stack trace: $stackTrace');
      Get.snackbar("Error", "Connection failed: $e");
    }
    
    print('🔷 ==========================================');
    print('🔷 ASSIGN DEVICE API CALL END');
    print('🔷 ==========================================');
  }

  Future<void> showAddDeviceDialog() async {
    final cameraStatus = await Permission.camera.status;
    
    if (cameraStatus.isDenied) {
      final result = await Permission.camera.request();
      if (result.isDenied) {
        Get.snackbar(
          'Permission Denied',
          'Camera permission is required to scan device QR code',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
          duration: const Duration(seconds: 3),
        );
        return;
      }
    } else if (cameraStatus.isPermanentlyDenied) {
      Get.dialog(
        Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.camera_alt_outlined,
                  size: 60,
                  color: Colors.orange[400],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Camera Permission Required',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Please enable camera permission in app settings to scan device QR codes',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.black54,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Get.back(),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Get.back();
                          openAppSettings();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[600],
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Settings'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
      return;
    }
    
    final String? result = await Get.to(() => const QRScannerView());
    
    if (result != null && result.isNotEmpty) {
      assignDevice(result);
    }
  }
}
