import 'dart:async';
import 'dart:convert';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../../core/config/env.dart';
import '../../../../../core/routes/app_routes.dart';
import '../../../../../utils/ui_utils.dart';

class ForgotPasswordController extends GetxController {
  var email = "".obs;
  var otp = "".obs;
  var newPassword = "".obs;
  var confirmPassword = "".obs;
  var isLoading = false.obs;
  var isOtpSent = false.obs;
  var isOtpVerified = false.obs;
  var timerSeconds = 0.obs;
  var isPasswordVisible = false.obs;
  var isConfirmPasswordVisible = false.obs;
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

  void resetState() {
    isOtpSent.value = false;
    isOtpVerified.value = false;
    otp.value = "";
    timerSeconds.value = 0;
    _timer?.cancel();
  }

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email);
  }

  Future<bool> sendOtp() async {
    if (email.value.isEmpty || !isValidEmail(email.value)) {
      UIUtils.showErrorDialog(message: "Please enter a valid email");
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
        // Navigate to OTP verification page if not already there
        if (Get.currentRoute != AppRoutes.otpVerification) {
          Get.toNamed(AppRoutes.otpVerification);
        }
        return true;
      } else {
        UIUtils.showErrorDialog(message: data['message'] ?? "Failed to send OTP");
        return false;
      }
    } catch (e) {
      UIUtils.showErrorDialog(message: "Connection failed");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> verifyOtp() async {
    if (otp.value.isEmpty || otp.value.length < 4) {
      UIUtils.showErrorDialog(message: "Please enter a valid OTP");
      return false;
    }
    
    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.verifyOtpEndpoint),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "user_email": email.value,
          "otp": otp.value,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        isOtpVerified.value = true;
        Get.toNamed(AppRoutes.resetPassword);
        return true;
      } else {
        UIUtils.showErrorDialog(message: data['message'] ?? "Invalid OTP");
        return false;
      }
    } catch (e) {
      UIUtils.showErrorDialog(message: "Connection failed");
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> resetPassword() async {
    if (newPassword.value.isEmpty || newPassword.value.length != 6) {
      UIUtils.showErrorDialog(message: 'password_must_be_6_numbers_error'.tr);
      return false;
    }
    if (newPassword.value != confirmPassword.value) {
      UIUtils.showErrorDialog(message: 'passwords_do_not_match_error'.tr);
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
        UIUtils.showErrorDialog(message: data['message'] ?? "Failed to reset password");
        return false;
      }
    } catch (e) {
      UIUtils.showErrorDialog(message: "Connection failed");
      return false;
    } finally {
      isLoading.value = false;
    }
  }
}
