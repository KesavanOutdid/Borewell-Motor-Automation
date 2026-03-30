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

  final subjectController = TextEditingController();
  final descriptionController = TextEditingController();

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
    fetchHelpRequests();
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
      helpRequests.clear();
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
      Get.snackbar("Error", "Please fill all fields", backgroundColor: Colors.red, colorText: Colors.white);
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
        }),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          subjectController.clear();
          descriptionController.clear();
          await fetchHelpRequests(isRefresh: true);
          Get.snackbar("Success", "Help request created successfully", backgroundColor: Colors.green, colorText: Colors.white);
          return true;
        }
      }
      Get.snackbar("Error", "Failed to create help request", backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } catch (e) {
      Get.snackbar("Error", "An error occurred", backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<bool> updateHelpRequest(String id) async {
    final subject = subjectController.text.trim();
    final description = descriptionController.text.trim();

    if (subject.isEmpty || description.isEmpty) {
      Get.snackbar("Error", "Please fill all fields", backgroundColor: Colors.red, colorText: Colors.white);
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
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          subjectController.clear();
          descriptionController.clear();
          await fetchHelpRequests(isRefresh: true);
          Get.snackbar("Success", "Help request updated successfully", backgroundColor: Colors.green, colorText: Colors.white);
          return true;
        }
      }
      Get.snackbar("Error", "Failed to update help request", backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } catch (e) {
      Get.snackbar("Error", "An error occurred", backgroundColor: Colors.red, colorText: Colors.white);
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
          Get.snackbar("Success", "Help request deleted successfully", backgroundColor: Colors.green, colorText: Colors.white);
          return true;
        }
      }
      Get.snackbar("Error", "Failed to delete help request", backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    } catch (e) {
      Get.snackbar("Error", "An error occurred", backgroundColor: Colors.red, colorText: Colors.white);
      return false;
    }
  }
}
