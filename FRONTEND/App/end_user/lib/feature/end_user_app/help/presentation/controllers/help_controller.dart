import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:logger/logger.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../data/models/help_model.dart';

class HelpController extends GetxController {
  final logger = Logger();
  late TokenService tokenService;
  final String baseUrl = AppConfig.baseUrl;

  var helpRequests = <HelpModel>[].obs;
  var isLoading = false.obs;
  var isSubmitting = false.obs;
  var errorMessage = "".obs;
  
  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var hasNextPage = false.obs;
  final int limit = 10;

  final subjects = <String>[
    'Technical Issue',
    'Device Connectivity',
    'Subscription Query',
    'Account Problem',
    'Feature Request',
    'Other'
  ].obs;
  
  var selectedSubject = "".obs;
  var showCustomSubject = false.obs;

  var userDevices = <Map<String, dynamic>>[].obs;
  var selectedDevice = Rxn<Map<String, dynamic>>();

  final subjectController = TextEditingController();
  final descriptionController = TextEditingController();

  void onSubjectChanged(String? val) {
    if (val == null) return;
    selectedSubject.value = val;
    if (val == 'Other') {
      showCustomSubject.value = true;
      subjectController.clear();
    } else {
      showCustomSubject.value = false;
      subjectController.text = val;
    }
  }

  void onDeviceChanged(Map<String, dynamic>? device) {
    selectedDevice.value = device;
  }

  Future<void> fetchUserDevices() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null) return;

    final url = Uri.parse('$baseUrl/app/getAssignedDevices?user_id=$userId');
    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final List<dynamic> data = responseData['devices'] ?? [];
          userDevices.assignAll(data.cast<Map<String, dynamic>>());
        }
      }
    } catch (e) {
      print("Error fetching devices: $e");
    }
  }

  void resetForm() {
    selectedSubject.value = "";
    showCustomSubject.value = false;
    selectedDevice.value = null;
    subjectController.clear();
    descriptionController.clear();
  }

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
    fetchHelpRequests();
    fetchUserDevices();
  }

  @override
  void onClose() {
    subjectController.dispose();
    descriptionController.dispose();
    super.onClose();
  }

  Future<void> fetchHelpRequests({bool isRefresh = false}) async {
    if (isRefresh) {
      currentPage.value = 1;
    }

    if (currentPage.value == 1) {
      isLoading.value = true;
      errorMessage.value = "";
    }

    final userId = tokenService.getUserId();
    final token = tokenService.getToken();

    if (userId == null) {
      isLoading.value = false;
      errorMessage.value = "User not logged in";
      return;
    }

    final url = Uri.parse('$baseUrl/app/getAllHelpByUser?user_id=$userId&page=${currentPage.value}&limit=$limit');
    
    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final List<dynamic> data = responseData['data'] ?? [];
          final pagination = responseData['pagination'];

          final List<HelpModel> newRequests = data.map((json) => HelpModel.fromJson(json)).toList();
          
          if (isRefresh) {
            helpRequests.assignAll(newRequests);
          } else {
            helpRequests.addAll(newRequests);
          }

          totalPages.value = pagination['totalPages'] ?? 1;
          hasNextPage.value = pagination['hasNextPage'] ?? false;
        }
      } else {
        errorMessage.value = "Failed to load help requests";
      }
    } catch (e) {
      if (e is SocketException) {
        errorMessage.value = "No internet connection";
      } else {
        errorMessage.value = "An error occurred";
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> loadMore() async {
    if (!isLoading.value && hasNextPage.value) {
      currentPage.value++;
      await fetchHelpRequests();
    }
  }

  Future<bool> createHelpRequest() async {
    final subject = subjectController.text.trim();
    final description = descriptionController.text.trim();

    if (subject.isEmpty || description.isEmpty) {
      return false;
    }

    isSubmitting.value = true;
    final userId = tokenService.getUserId();
    final userName = tokenService.getUserName();
    
    // Get phone from cached profile
    final userProfile = GetStorage().read('user_profile');
    final userMobile = userProfile != null ? userProfile['user_phone']?.toString() : "";
    
    final token = tokenService.getToken();

    final url = Uri.parse('$baseUrl/app/createHelp');

    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "user_id": userId,
          "user_name": userName,
          "user_mobile": userMobile ?? "", // Might need to fetch from profile if not in tokenService
          "subject": subject,
          "description": description,
          "serial_number": selectedDevice.value?['serial_number'] ?? selectedDevice.value?['serialNumber'],
          "device_nickname": selectedDevice.value?['device_nickname'] ?? selectedDevice.value?['nickname'],
          "device_id": selectedDevice.value?['_id'],
        }),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          resetForm();
          fetchHelpRequests(isRefresh: true);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<bool> updateHelpRequest(String id) async {
    final subject = subjectController.text.trim();
    final description = descriptionController.text.trim();

    if (subject.isEmpty || description.isEmpty) {
      return false;
    }

    isSubmitting.value = true;
    final token = tokenService.getToken();
    final url = Uri.parse('$baseUrl/app/updateHelp');

    try {
      final response = await http.put(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "id": id,
          "subject": subject,
          "description": description,
          "serial_number": selectedDevice.value?['serial_number'] ?? selectedDevice.value?['serialNumber'],
          "device_nickname": selectedDevice.value?['device_nickname'] ?? selectedDevice.value?['nickname'],
          "device_id": selectedDevice.value?['_id'],
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          resetForm();
          fetchHelpRequests(isRefresh: true);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<bool> deleteHelpRequest(String id) async {
    final token = tokenService.getToken();
    final url = Uri.parse('$baseUrl/app/deleteHelp');

    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "id": id,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          await fetchHelpRequests(isRefresh: true);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
