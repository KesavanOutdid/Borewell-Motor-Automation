import 'dart:async';
import 'dart:convert';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../../core/config/env.dart';
import '../../../../../utils/ui_utils.dart';

class ForgotPasswordController extends GetxController {
  var email = "".obs;
  var otp = "".obs;
  var newPassword = "".obs;
  var isLoading = false.obs;
  var isOtpSent = false.obs;
  var timerSeconds = 0.obs;
  Timer? _timer;

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }

  void startTimer() {
    timerSeconds.value = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (timerSeconds.value > 0) {
        timerSeconds.value--;
      } else {
        _timer?.cancel();
      }
    });
  }

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email);
  }

  Future<bool> sendOtp() async {
    if (email.value.isEmpty || !isValidEmail(email.value)) {
      UIUtils.showErrorSnackbar(title: "Error", message: "Please enter a valid email");
      return false;
    }

    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.sendOtpEndpoint),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"user_email": email.value}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        isOtpSent.value = true;
        startTimer();
        UIUtils.showSuccessSnackbar(title: "Success", message: "OTP sent to your email");
        return true;
      } else {
        UIUtils.showErrorSnackbar(title: "Error", message: data['message'] ?? "Failed to send OTP");
        return false;
      }
    } catch (e) {
      UIUtils.showErrorSnackbar(title: "Error", message: "Connection failed");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> resetPassword() async {
    if (otp.value.isEmpty || otp.value.length < 4) {
      UIUtils.showErrorSnackbar(title: "Error", message: "Please enter a valid OTP");
      return false;
    }
    if (newPassword.value.isEmpty || newPassword.value.length != 6) {
      UIUtils.showErrorSnackbar(title: "Error", message: "Password must be 6 numbers");
      return false;
    }

    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.verifyOtpAndResetPasswordEndpoint),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "user_email": email.value,
          "otp": otp.value,
          "new_password": newPassword.value,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return true;
      } else {
        UIUtils.showErrorSnackbar(title: "Error", message: data['message'] ?? "Failed to reset password");
        return false;
      }
    } catch (e) {
      UIUtils.showErrorSnackbar(title: "Error", message: "Connection failed");
      return false;
    } finally {
      isLoading.value = false;
    }
  }
}
