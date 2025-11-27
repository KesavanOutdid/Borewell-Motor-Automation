import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

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

  Future<void> signup() async {
    if (name.value.isEmpty) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Please enter name");
      });
      return;
    }

    if (email.value.isEmpty || !isValidEmail(email.value)) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Please enter valid email");
      });
      return;
    }

    if (!isValidPhone(phone.value)) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Phone must be 10 digits");
      });
      return;
    }

    if (password.value.isEmpty || password.value.length != 6) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Password must be 6 digits");
      });
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
          "role_id": 2
        }),
      );

      isLoading.value = false;

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        final userEmail = responseData['user']['user_email'] ?? email.value;
        
        Future.delayed(Duration.zero, () {
          Get.snackbar("Success", "Account created successfully");
        });
        Get.offNamed('/login', arguments: {'email': userEmail});
      } else {
        final Map<String, dynamic> errorData = jsonDecode(response.body);
        String errorMsg = "Signup failed";
        if (errorData['errors'] != null && errorData['errors'].isNotEmpty) {
          errorMsg = errorData['errors'][0]['msg'] ?? errorMsg;
        }
        Future.delayed(Duration.zero, () {
          Get.snackbar("Error", errorMsg);
        });
      }
    } catch (e) {
      isLoading.value = false;
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Connection failed: $e");
      });
    }
  }
}
