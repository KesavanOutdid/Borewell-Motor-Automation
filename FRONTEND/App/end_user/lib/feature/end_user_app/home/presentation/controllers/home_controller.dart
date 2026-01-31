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
  var selectedFilter = 'All'.obs;
  late TokenService tokenService;
  final _storage = GetStorage();

  void setFilter(String filter) {
    selectedFilter.value = filter;
  }

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

      await Future.delayed(const Duration(milliseconds: 300));
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Device assigned successfully');
        final jsonData = jsonDecode(response.body);
        print('🟢 SUCCESS DIALOG OPENED: Device assigned successfully');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Success'),
              content: Text(jsonData['message'] ?? "Device assigned successfully"),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
        await fetchDevices();
      } else if (response.statusCode == 401) {
        print('❌ Unauthorized - Session expired');
        print('🔴 ERROR DIALOG OPENED: Session expired');
        Get.offAllNamed('/login');
      } else if (response.statusCode == 404) {
        print('❌ Device not found');
        print('🔴 ERROR DIALOG OPENED: Device not found');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: const Text('Device not found'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      } else if (response.statusCode == 400) {
        print('❌ Bad request');
        final jsonData = jsonDecode(response.body);
        final errorMsg = jsonData['message'] ?? "Invalid request";
        print('🔴 ERROR DIALOG OPENED: $errorMsg');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: Text(errorMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      } else {
        print('❌ Failed with status: ${response.statusCode}');
        final jsonData = jsonDecode(response.body);
        final errorMsg = jsonData['message'] ?? "Failed to assign device";
        print('🔴 ERROR DIALOG OPENED: $errorMsg');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: Text(errorMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      }
    } catch (e, stackTrace) {
      print('❌ Exception occurred: $e');
      print('❌ Stack trace: $stackTrace');
      print('🔴 ERROR DIALOG OPENED: Connection failed');
      await Future.delayed(const Duration(milliseconds: 300));
      Get.dialog(
        Builder(
          builder: (context) => AlertDialog(
            title: const Text('Error'),
            content: Text('Connection failed: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
        barrierDismissible: false,
      );
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
        Builder(
          builder: (context) => Dialog(
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
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
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
        ),
      );
      return;
    }
    
    final String? result = await Get.to(() => const QRScannerView());
    
    if (result != null && result.isNotEmpty) {
      assignDevice(result);
    }
  }
    
  Future<void> respondToShare(String serial, String action) async {
    isLoading.value = true;
    try {
      final token = tokenService.getToken();
      final userId = tokenService.getUserId();
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/respondToDeviceShare'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'serial_number': serial,
          'user_id': userId,
          'action': action,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        Get.snackbar('Success', 'Sharing request ${action} successfully');
        fetchDevices();
      } else {
        Get.snackbar('Error', data['message'] ?? 'Failed to respond to request');
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to respond to request');
    } finally {
      isLoading.value = false;
    }
  }
}
