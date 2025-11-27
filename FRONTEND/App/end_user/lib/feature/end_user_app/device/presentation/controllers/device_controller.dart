import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class DeviceController extends GetxController {
  var deviceDetails = <String, dynamic>{}.obs;
  var isLoading = false.obs;

  Future<void> fetchDeviceDetails(String deviceId) async {
    isLoading.value = true;

    final url = Uri.parse(AppConfig.baseUrl + AppConfig.deviceEndpoint);

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        deviceDetails.value = Map<String, dynamic>.from(jsonData);
      } else {
        Get.snackbar("Error", "Failed to fetch device details");
      }
    } catch (e) {
      Get.snackbar("Error", "Connection failed: $e");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateDeviceStatus(String deviceId, String status) async {
    try {
      final url = Uri.parse(AppConfig.baseUrl + AppConfig.deviceEndpoint);

      final response = await http.post(
        url,
        body: {
          "device_id": deviceId,
          "status": status,
        },
      );

      if (response.statusCode == 200) {
        Get.snackbar("Success", "Device status updated");
      } else {
        Get.snackbar("Error", "Failed to update device status");
      }
    } catch (e) {
      Get.snackbar("Error", "Connection failed: $e");
    }
  }
}
