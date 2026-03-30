import 'package:get/get.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../core/services/notification_storage_service.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import '../../../../../utils/ui_utils.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';

class AuthController extends GetxController {
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
    }
  }

  void loadStoredToken() {
    authToken.value = tokenService.getToken() ?? "";
    userId.value = tokenService.getUserId() ?? 0;
    userName.value = tokenService.getUserName() ?? "";
    email.value = tokenService.getUserEmail() ?? "";
  }

  Future<void> logout() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final token = await messaging.getToken();
      if (token != null && email.value.isNotEmpty) {
        final url = Uri.parse(AppConfig.baseUrl + AppConfig.removeFcmTokenEndpoint);
        await http.post(
          url,
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${authToken.value}"
          },
          body: jsonEncode({
            "user_email": email.value,
            "fcm_token": token
          }),
        );
        print('🔔 FCM Token Removed on Logout: $token');
        
        // Also delete token from Firebase to be sure
        await messaging.deleteToken();
        print('🔔 FCM Token Deleted from Firebase instance');
      }
    } catch (e) {
      print('❌ Error removing FCM token on logout: $e');
    }

    email.value = "";
    password.value = "";
    authToken.value = "";
    userId.value = 0;
    userName.value = "";
    userPhone.value = "";
    roleId.value = 0;
    
    await tokenService.clearToken();
    
    final notificationService = NotificationStorageService();
    await notificationService.clearAllNotifications();
  }

  Future<void> updateFcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final token = await messaging.getToken();
      
      if (token != null && email.value.isNotEmpty) {
        final url = Uri.parse(AppConfig.baseUrl + AppConfig.updateFcmTokenEndpoint);
        await http.post(
          url,
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${authToken.value}"
          },
          body: jsonEncode({
            "user_email": email.value,
            "fcm_token": token
          }),
        );
        print('🔔 FCM Token Updated: $token');
      }
    } catch (e) {
      print('❌ Error updating FCM token: $e');
    }
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
    print('🔐 Login URL: $url');
    print('📧 Email: ${email.value}');

    try {
      print('📡 Sending login request...');
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "user_email": email.value,
          "password": password.value,
          "role_id": 2
        }),
      ).timeout(const Duration(seconds: 10));

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      isLoading.value = false;

      final Map<String, dynamic> responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
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
          
          // Update FCM Token on successful login
          await updateFcmToken();
          
          Get.offAllNamed('/home');
          
          try {
            final homeController = Get.find<HomeController>();
            homeController.fetchDevices();
          } catch (e) {
            print('HomeController not found: $e');
          }
        } else {
          return responseData['message'] ?? "Login failed";
        }
      } else if (response.statusCode == 403) {
        final msg = responseData['message'] ?? "User is deactivated";
        UIUtils.showErrorDialog(title: "Account Alert", message: msg);
        return msg;
      } else {
        return responseData['message'] ?? "Invalid credentials";
      }
    } catch (e) {
      isLoading.value = false;
      return "Connection failed: $e";
    }
    return null;
  }
}
