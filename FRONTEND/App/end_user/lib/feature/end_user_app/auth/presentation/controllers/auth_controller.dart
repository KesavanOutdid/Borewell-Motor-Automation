import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class LoginController extends GetxController {
  var email = "".obs;
  var password = "".obs;
  var isLoading = false.obs;
  var isPasswordVisible = false.obs;
  var authToken = "".obs;
  var userName = "".obs;
  var userId = 0.obs;
  var userPhone = "".obs;
  var roleId = 0.obs;
  
  late TokenService tokenService;

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
    loadStoredToken();
    
    final arguments = Get.arguments as Map<String, dynamic>?;
    if (arguments != null && arguments['email'] != null) {
      email.value = arguments['email'];
    } else {
      final lastEmail = tokenService.getLastEmail();
      if (lastEmail != null && lastEmail.isNotEmpty) {
        email.value = lastEmail;
      }
    }
  }

  void loadStoredToken() {
    authToken.value = tokenService.getToken() ?? "";
    userId.value = tokenService.getUserId() ?? 0;
    userName.value = tokenService.getUserName() ?? "";
  }

  Future<void> logout() async {
    email.value = "";
    password.value = "";
    authToken.value = "";
    userId.value = 0;
    userName.value = "";
    userPhone.value = "";
    roleId.value = 0;
    await tokenService.clearToken();
  }

  bool isValidEmail(String email) {
    return RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email);
  }

  Future<String?> login() async {
    if (email.value.isEmpty || !isValidEmail(email.value)) {
      return "Please enter valid email";
    }

    if (password.value.isEmpty || password.value.length != 6) {
      return "Password must be 6 numbers";
    }

    isLoading.value = true;

    final url = Uri.parse(AppConfig.baseUrl + AppConfig.loginEndpoint);

    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "user_email": email.value,
          "password": password.value,
          "role_id": 2
        }),
      );

      isLoading.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          authToken.value = responseData['token'] ?? "";
          final userData = responseData['user'];
          userId.value = userData['user_id'] ?? 0;
          userName.value = userData['user_name'] ?? "";
          userPhone.value = userData['user_phone']?.toString() ?? "";
          roleId.value = userData['role_id'] ?? 0;
          
          await tokenService.saveToken(
            authToken.value,
            userId.value,
            userName.value,
            userEmail: userData['user_email'] ?? email.value,
          );
          await tokenService.saveLastEmail(email.value);
          
          Get.offAllNamed('/home');
          
          final homeController = Get.find<HomeController>();
          homeController.fetchDevices();
        } else {
          isLoading.value = false;
          return responseData['message'] ?? "Login failed";
        }
      } else {
        isLoading.value = false;
        return "Invalid credentials";
      }
    } catch (e) {
      isLoading.value = false;
      return "Connection failed: $e";
    }
    return null;
  }
}
