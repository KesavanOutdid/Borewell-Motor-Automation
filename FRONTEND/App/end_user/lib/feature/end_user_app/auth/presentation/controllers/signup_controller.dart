import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/material.dart';

class SignupController extends GetxController {
  var name = "".obs;
  var email = "".obs;
  var phone = "".obs;
  var password = "".obs;
  var isLoading = false.obs;

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email);
  }

  bool isValidPhone(String phone) {
    return phone.length == 10 && RegExp(r'^[0-9]+$').hasMatch(phone);
  }

  void _showErrorDialog(String message) {
    Get.dialog(
      AlertDialog(
        title: const Text("Error"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              if (Get.isDialogOpen ?? false) {
                Navigator.of(Get.overlayContext!).pop();
              }
            },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(String email) {
    Get.dialog(
      AlertDialog(
        title: const Text("Success"),
        content: const Text("Account created successfully"),
        actions: [
          TextButton(
            onPressed: () {
              if (Get.isDialogOpen ?? false) {
                Navigator.of(Get.overlayContext!).pop();
              }
              Get.offNamed('/login', arguments: {'email': email});
            },
            child: const Text("OK"),
          ),
        ],
      ),
      barrierDismissible: false,
    );
  }

  Future<void> signup() async {
    if (name.value.isEmpty) {
      _showErrorDialog("Please enter name");
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
        final userEmail = responseData['user']['user_email'] ?? email.value;
        _showSuccessDialog(userEmail);
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
