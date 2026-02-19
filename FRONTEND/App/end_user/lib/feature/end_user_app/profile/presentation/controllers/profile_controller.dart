import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:logger/logger.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:http_parser/http_parser.dart';

class ProfileController extends GetxController {
  final formKey = GlobalKey<FormState>();
  var userName = "".obs;
  var userEmail = "".obs;
  var userPhone = "".obs;
  var userIdValue = 0.obs;
  var roleIdValue = 0.obs;
  var userProfileImage = "".obs;
  var isLoading = false.obs;
  var isUpdating = false.obs;
  var isPasswordVisible = false.obs;
  var errorMessage = "".obs;
  var hasChanges = false.obs;
  var oldPassword = "".obs;

  final logger = Logger();
  final ImagePicker _picker = ImagePicker();
  final _storage = GetStorage();

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
    
    _loadCachedProfile();
    
    tokenService = Get.find<TokenService>();
    fetchProfile();
  }

  void _loadCachedProfile() {
    try {
      final cached = _storage.read('user_profile');
      if (cached != null) {
        final user = Map<String, dynamic>.from(cached);
        userName.value = user['user_name'] ?? "";
        userEmail.value = user['user_email'] ?? "";
        userPhone.value = user['user_phone']?.toString() ?? "";
        userIdValue.value = user['user_id'] ?? 0;
        roleIdValue.value = user['role_id'] ?? 0;
        userProfileImage.value = user['profile_image'] ?? "";
        oldPassword.value = user['password']?.toString() ?? "";
        print('👤 [PROFILE] Loaded profile from cache');
      }
    } catch (e) {
      print('👤 [PROFILE] Error loading cached profile: $e');
    }
  }

  @override
  void onClose() {
    nameEditingController.dispose();
    emailEditingController.dispose();
    phoneEditingController.dispose();
    passwordEditingController.dispose();
    super.onClose();
  }

  void _showSafeSnackbar(String title, String message, {bool isError = true}) {
    if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
      Get.snackbar(
        title,
        message,
        backgroundColor: (isError ? Colors.red : Colors.green).withOpacity(0.8),
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
    } else {
      logger.w('⚠️ Cannot show snackbar: No overlay found');
    }
  }

  Future<void> fetchProfile() async {
    logger.i('👤 fetchProfile called');
    isLoading.value = true;
    errorMessage.value = "";
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();

    if (userId == null || userId == 0) {
      logger.e('❌ userId is null or 0');
      isLoading.value = false;
      errorMessage.value = "User ID not found";
      return;
    }

    final url = Uri.parse("${AppConfig.baseUrl}/app/profile/$userId");
    logger.i('🌐 URL: $url');

    try {
      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      logger.i('📡 Response Status: ${response.statusCode}');
      logger.d('📄 Body: ${response.body}');

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
          userProfileImage.value = user['profile_image'] ?? "";
          oldPassword.value = user['password']?.toString() ?? "";
          
          // Keep TokenService in sync
          await tokenService.saveToken(
            tokenService.getToken() ?? "",
            userIdValue.value,
            userName.value,
            userEmail: userEmail.value,
          );
          
          await _storage.write('user_profile', user);
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
      if (e is SocketException) {
        errorMessage.value = "Network connection failed. Please check your internet.";
      } else {
        errorMessage.value = "An error occurred. Please try again.";
      }
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
    logger.i('📝 updateProfile called');
    final name = nameEditingController.text.trim();
    if (name.isEmpty) {
      return "Name cannot be empty";
    }

    if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(name)) {
      return "Name should contain letters only.";
    }

    if (name.length > 40) {
      return "Name should not exceed 40 characters.";
    }

    if (emailEditingController.text.isEmpty) {
      return "Email cannot be empty";
    }

    if (phoneEditingController.text.isEmpty || phoneEditingController.text.length != 10) {
      return "Phone must be 10 digits";
    }

    final password = passwordEditingController.text;
    if (password.isEmpty || password.length != 6) {
      return "Password must be exactly 6 digits";
    }

    isUpdating.value = true;
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    if (userId == null || userId == 0) {
      logger.e('❌ userId is null or 0');
      isUpdating.value = false;
      return "User ID not found";
    }

    final url = Uri.parse("${AppConfig.baseUrl}${AppConfig.updateProfileEndpoint}/$userId");
    logger.i('🌐 URL: $url');

    try {
      final body = {
        "user_name": name,
        "user_email": emailEditingController.text,
        "role_id": roleIdValue.value,
      };
      
      // Only send phone if it's different and parse as int to match backend expectation
      final currentPhone = phoneEditingController.text;
      if (currentPhone != userPhone.value) {
        body["user_phone"] = int.tryParse(currentPhone) ?? currentPhone;
      }

      if (password != oldPassword.value) {
        body["password"] = int.tryParse(password) ?? password;
      }

      logger.d('📦 Body: $body');

      final response = await http.put(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode(body),
      );

      logger.i('📡 Response Status: ${response.statusCode}');
      logger.d('📄 Body: ${response.body}');

      isUpdating.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          final user = responseData['user'];
          userName.value = user['user_name'] ?? "";
          userEmail.value = user['user_email'] ?? "";
          userPhone.value = user['user_phone']?.toString() ?? "";
          
          // Update local password state since backend excludes it from response
          if (password != oldPassword.value) {
            oldPassword.value = password.toString();
          }
          
          // Keep TokenService in sync
          await tokenService.saveToken(
            tokenService.getToken() ?? "",
            userIdValue.value,
            userName.value,
            userEmail: userEmail.value,
          );
          
          // Ensure password is preserved in cache
          final updatedCache = Map<String, dynamic>.from(user);
          updatedCache['password'] = oldPassword.value;
          
          await _storage.write('user_profile', updatedCache);
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
      if (e is SocketException) {
        return "Network connection failed. Please check your internet.";
      }
      return "An error occurred. Please try again.";
    }
  }

  Future<void> pickAndUploadImage(ImageSource source) async {
    try {
      if (source == ImageSource.camera) {
        var status = await Permission.camera.status;
        if (status.isDenied) {
          status = await Permission.camera.request();
          if (status.isDenied) {
            Get.rawSnackbar(
              title: "Permission Denied",
              message: "Please allow camera access to take a profile photo",
              backgroundColor: Colors.red.withOpacity(0.8),
            );
            return;
          }
        }
        if (status.isPermanentlyDenied) {
          openAppSettings();
          return;
        }
      } else if (source == ImageSource.gallery) {
        var status = Platform.isAndroid 
            ? await Permission.photos.status 
            : await Permission.photos.status;
        
        // For Android 13+ use photos permission, for older use storage
        if (Platform.isAndroid) {
          status = await Permission.photos.request();
        } else {
          status = await Permission.photos.request();
        }

        if (status.isDenied) {
          Get.rawSnackbar(
            title: "Permission Denied",
            message: "Please allow access to your gallery to pick a profile photo",
            backgroundColor: Colors.red.withOpacity(0.8),
          );
          return;
        }
      }

      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 50,
      );

      if (image != null) {
        await uploadProfileImage(File(image.path));
      }
    } catch (e) {
      _showSafeSnackbar("Error", "Failed to pick image: $e");
    }
  }

  Future<void> uploadProfileImage(File imageFile) async {
    logger.i('🖼️ uploadProfileImage called');
    isUpdating.value = true;
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    if (userId == null || userId == 0) {
      logger.e('❌ userId is null or 0');
      isUpdating.value = false;
      _showSafeSnackbar("Error", "User ID not found");
      return;
    }

    final url = Uri.parse("${AppConfig.baseUrl}${AppConfig.uploadProfileImageEndpoint}/$userId");
    logger.i('🌐 URL: $url');
    logger.i('📁 File Path: ${imageFile.path}');

    try {
      var request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer $token';
      
      // Determine content type from file extension
      String extension = imageFile.path.split('.').last.toLowerCase();
      String mimeType = 'image/jpeg'; // default
      if (extension == 'png') mimeType = 'image/png';
      else if (extension == 'jpg' || extension == 'jpeg') mimeType = 'image/jpeg';
      else if (extension == 'gif') mimeType = 'image/gif';
      else if (extension == 'webp') mimeType = 'image/webp';

      request.files.add(
        await http.MultipartFile.fromPath(
          'image',
          imageFile.path,
          contentType: MediaType.parse(mimeType),
        ),
      );

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      logger.i('📡 Response Status: ${response.statusCode}');
      logger.d('📄 Body: ${response.body}');

      isUpdating.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          userProfileImage.value = responseData['profile_image'] ?? "";
          Get.dialog(
            AlertDialog(
              title: const Text("Success"),
              content: const Text("Profile photo updated successfully"),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(Get.context!),
                  child: const Text("OK"),
                ),
              ],
            ),
          );
        } else {
          _showSafeSnackbar("Error", responseData['message'] ?? "Upload failed");
        }
      } else {
        _showSafeSnackbar("Error", "Failed to upload image: ${response.statusCode}");
      }
    } catch (e) {
      isUpdating.value = false;
      String msg = "An error occurred. Please try again.";
      if (e is SocketException) {
        msg = "Network connection failed. Please check your internet.";
      }
      _showSafeSnackbar("Error", msg);
    }
  }

  Future<void> removeProfileImage() async {
    logger.i('🗑️ removeProfileImage called');
    isUpdating.value = true;
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    if (userId == null || userId == 0) {
      logger.e('❌ userId is null or 0');
      isUpdating.value = false;
      _showSafeSnackbar("Error", "User ID not found");
      return;
    }

    final url = Uri.parse("${AppConfig.baseUrl}${AppConfig.deleteProfileImageEndpoint}/$userId");
    logger.i('🌐 URL: $url');

    try {
      final response = await http.delete(
        url,
        headers: {
          "Authorization": "Bearer $token",
        },
      );

      logger.i('📡 Response Status: ${response.statusCode}');
      logger.d('📄 Body: ${response.body}');

      isUpdating.value = false;

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          userProfileImage.value = "";
          _showSafeSnackbar("Success", "Profile image removed successfully", isError: false);
        } else {
          _showSafeSnackbar("Error", responseData['message'] ?? "Removal failed");
        }
      } else {
        _showSafeSnackbar("Error", "Failed to remove image: ${response.statusCode}");
      }
    } catch (e) {
      isUpdating.value = false;
      String msg = "An error occurred. Please try again.";
      if (e is SocketException) {
        msg = "Network connection failed. Please check your internet.";
      }
      _showSafeSnackbar("Error", msg);
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
      if (e is SocketException) {
        return "Network connection failed. Please check your internet.";
      }
      return "An error occurred. Please try again.";
    }
  }
}
