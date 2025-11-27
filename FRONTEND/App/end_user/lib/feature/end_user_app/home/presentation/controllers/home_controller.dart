import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
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
        Get.snackbar("Error", "Session expired. Please login again");
        Future.delayed(const Duration(milliseconds: 500), () {
          Get.offAllNamed('/login');
        });
      } else if (response.statusCode == 404) {
        devices.value = [];
      } else {
        Get.snackbar("Error", "Failed to fetch devices");
      }
    } catch (e) {
      Get.snackbar("Error", "Connection failed: $e");
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
}
