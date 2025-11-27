import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ProfileController extends GetxController {
  var userName = "".obs;
  var userEmail = "".obs;
  var userPhone = "".obs;
  var userIdValue = 0.obs;
  var roleIdValue = 0.obs;
  var isLoading = false.obs;
  var isUpdating = false.obs;
  var isPasswordVisible = false.obs;
  var errorMessage = "".obs;
  var hasChanges = false.obs;
  var oldPassword = "".obs;

  void _checkChanges() {
    hasChanges.value = nameEditingController.text != userName.value ||
           emailEditingController.text != userEmail.value ||
           phoneEditingController.text != userPhone.value ||
           passwordEditingController.text != oldPassword.value;
  }

  late TextEditingController nameEditingController;
  late TextEditingController emailEditingController;
  late TextEditingController phoneEditingController;
  late TextEditingController passwordEditingController;

  late TokenService tokenService;

  @override
  void onInit() {
    super.onInit();
    nameEditingController = TextEditingController();
    emailEditingController = TextEditingController();
    phoneEditingController = TextEditingController();
    passwordEditingController = TextEditingController();
    
    nameEditingController.addListener(_checkChanges);
    emailEditingController.addListener(_checkChanges);
    phoneEditingController.addListener(_checkChanges);
    passwordEditingController.addListener(_checkChanges);
    
    tokenService = Get.find<TokenService>();
    fetchProfile();
  }

  @override
  void onClose() {
    nameEditingController.dispose();
    emailEditingController.dispose();
    phoneEditingController.dispose();
    passwordEditingController.dispose();
    super.onClose();
  }

  Future<void> fetchProfile() async {
    isLoading.value = true;
    errorMessage.value = "";
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();

    if (userId == null || userId == 0) {
      isLoading.value = false;
      errorMessage.value = "User ID not found";
      return;
    }

    final url = Uri.parse("${AppConfig.baseUrl}/app/profile/$userId");

    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      isLoading.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final user = responseData['user'];
          userName.value = user['user_name'] ?? "";
          userEmail.value = user['user_email'] ?? "";
          userPhone.value = user['user_phone']?.toString() ?? "";
          userIdValue.value = user['user_id'] ?? 0;
          roleIdValue.value = user['role_id'] ?? 0;
          oldPassword.value = user['password']?.toString() ?? "";
        } else {
          isLoading.value = false;
          errorMessage.value = responseData['message'] ?? "Failed to fetch profile";
          return;
        }
      } else if (response.statusCode == 401) {
        isLoading.value = false;
        Get.offAllNamed('/login');
        errorMessage.value = "Session expired";
        return;
      } else {
        isLoading.value = false;
        errorMessage.value = "Failed to fetch profile";
        return;
      }
    } catch (e) {
      isLoading.value = false;
      errorMessage.value = "Connection failed: $e";
      return;
    }
  }

  void initEditFields() {
    nameEditingController.text = userName.value;
    emailEditingController.text = userEmail.value;
    phoneEditingController.text = userPhone.value;
    passwordEditingController.text = oldPassword.value;
    isPasswordVisible.value = false;
  }

  Future<String?> updateProfile() async {
    if (nameEditingController.text.isEmpty) {
      return "Name cannot be empty";
    }

    if (emailEditingController.text.isEmpty) {
      return "Email cannot be empty";
    }

    if (phoneEditingController.text.isEmpty || phoneEditingController.text.length != 10) {
      return "Phone must be 10 digits";
    }

    final password = passwordEditingController.text;
    if (password != oldPassword.value && (password.isEmpty || password.length != 6)) {
      return "Password must be 6 digits";
    }

    isUpdating.value = true;
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    if (userId == null || userId == 0) {
      isUpdating.value = false;
      return "User ID not found";
    }

    final url = Uri.parse("${AppConfig.baseUrl}${AppConfig.updateProfileEndpoint}/$userId");

    try {
      final body = {
        "user_name": nameEditingController.text,
        "user_email": emailEditingController.text,
        "user_phone": phoneEditingController.text,
        "role_id": roleIdValue.value,
      };
      
      if (password != oldPassword.value) {
        body["password"] = password;
      }

      final response = await http.put(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode(body),
      );

      isUpdating.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final user = responseData['user'];
          userName.value = user['user_name'] ?? "";
          userEmail.value = user['user_email'] ?? "";
          userPhone.value = user['user_phone']?.toString() ?? "";
          return null; // Success
        } else {
          isUpdating.value = false;
          return responseData['message'] ?? "Update failed";
        }
      } else if (response.statusCode == 401) {
        isUpdating.value = false;
        Get.offAllNamed('/login');
        return "Session expired";
      } else {
        isUpdating.value = false;
        return "Failed to update profile";
      }
    } catch (e) {
      isUpdating.value = false;
      return "Connection failed: $e";
    }
  }

  Future<String?> changePassword(String newPassword) async {
    if (newPassword.isEmpty || newPassword.length != 6) {
      return "New password must be 6 digits";
    }

    isUpdating.value = true;
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    if (userId == null || userId == 0) {
      isUpdating.value = false;
      return "User ID not found";
    }

    final url = Uri.parse("${AppConfig.baseUrl}${AppConfig.updateProfileEndpoint}/$userId");

    try {
      final response = await http.put(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "user_name": userName.value,
          "user_email": userEmail.value,
          "user_phone": userPhone.value,
          "password": newPassword,
          "role_id": roleIdValue.value,
        }),
      );

      isUpdating.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          return null; // Success
        } else {
          isUpdating.value = false;
          return responseData['message'] ?? "Password change failed";
        }
      } else if (response.statusCode == 401) {
        isUpdating.value = false;
        Get.offAllNamed('/login');
        return "Session expired";
      } else {
        isUpdating.value = false;
        return "Failed to change password";
      }
    } catch (e) {
      isUpdating.value = false;
      return "Connection failed: $e";
    }
  }
}
