import 'package:get/get.dart';
import 'package:agri_plus/utils/ui_utils.dart';
import '../../../../../core/config/env.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../../../core/services/token_service.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import './auth_controller.dart';

class SignupController extends GetxController {
  var name = "".obs;
  var email = "".obs;
  var phone = "".obs;
  var password = "".obs;
  var isLoading = false.obs;

  late TokenService tokenService;

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email);
  }

  bool isValidPhone(String phone) {
    return phone.length == 10 && RegExp(r'^[0-9]+$').hasMatch(phone);
  }

  void _showErrorDialog(String message) {
    UIUtils.showErrorDialog(message: message);
  }

  Future<void> signup() async {
    if (name.value.isEmpty) {
      _showErrorDialog("Please enter name");
      return;
    }

    if (name.value.trim().length > 40) {
      _showErrorDialog("Name should not exceed 40 characters");
      return;
    }

    if (email.value.isEmpty || !isValidEmail(email.value)) {
      _showErrorDialog("Please enter valid email");
      return;
    }

    if (!isValidPhone(phone.value)) {
      _showErrorDialog("Phone must be 10 digits");
      return;
    }

    if (password.value.isEmpty || password.value.length != 6) {
      _showErrorDialog("Password must be 6 digits");
      return;
    }

    isLoading.value = true;

    final url = Uri.parse(AppConfig.baseUrl + AppConfig.signupEndpoint);

    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "user_name": name.value,
          "user_email": email.value,
          "user_phone": phone.value,
          "password": int.parse(password.value),
          "role_id": 2,
          "createdBy": email.value
        }),
      );

      isLoading.value = false;

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          final authToken = responseData['token'] ?? "";
          final userData = responseData['user'];
          final userId = userData['user_id'] ?? 0;
          final userName = userData['user_name'] ?? "";
          final userEmail = userData['user_email'] ?? email.value;
          
          await tokenService.saveToken(
            authToken,
            userId,
            userName,
            userEmail: userEmail,
          );
          
          // Update AuthController state if needed
          try {
            final authController = Get.find<AuthController>();
            authController.loadStoredToken();
            authController.email.value = userEmail;
            await authController.updateFcmToken();
          } catch (e) {
            print('AuthController not found: $e');
          }

          Get.offAllNamed('/home');
          
          try {
            final homeController = Get.find<HomeController>();
            homeController.fetchDevices();
          } catch (e) {
            print('HomeController not found: $e');
          }
        } else {
          _showErrorDialog(responseData['message'] ?? "Signup failed");
        }
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        String errorMsg = "Signup failed";
        
        if (errorData['message'] != null) {
          errorMsg = errorData['message'];
        } else if (errorData['errors'] != null && errorData['errors'].isNotEmpty) {
          errorMsg = errorData['errors'][0]['msg'] ?? errorMsg;
        }
        
        _showErrorDialog(errorMsg);
      }
    } catch (e) {
      isLoading.value = false;
      _showErrorDialog("Connection failed: $e");
    }
  }
}
