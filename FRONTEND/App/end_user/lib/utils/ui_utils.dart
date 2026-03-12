import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'theme/app_colors.dart';
import '../feature/end_user_app/auth/presentation/controllers/auth_controller.dart';

class UIUtils {
  static bool _isDialogShowing = false;

  static void handleAccountDeactivated([String? message]) {
    if (_isDialogShowing || (Get.isDialogOpen ?? false)) return;
    
    final msg = message ?? "Your account has been deactivated. Please contact admin.";
    
    showErrorDialog(
      title: 'Account Alert',
      message: msg,
    );

    // Logout after a small delay to allow the user to see the dialog
    Future.delayed(const Duration(seconds: 1), () {
      try {
        final authController = Get.find<AuthController>();
        authController.logout();
        Get.offAllNamed('/login');
      } catch (e) {
        print('Error during logout: $e');
        Get.offAllNamed('/login');
      }
    });
  }

  static void showErrorDialog({String title = 'Error', required String message}) {
    if (_isDialogShowing || (Get.isDialogOpen ?? false)) return;
    _isDialogShowing = true;
    
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              if (Get.isDialogOpen ?? false) {
                Navigator.of(Get.context!, rootNavigator: true).pop();
              }
              _isDialogShowing = false;
            },
            child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
          ),
        ],
      ),
      barrierDismissible: false,
    ).then((_) => _isDialogShowing = false);
  }

  static void showSuccessDialog({String title = 'Success', required String message}) {
    if (_isDialogShowing || (Get.isDialogOpen ?? false)) return;
    _isDialogShowing = true;

    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: AppColors.primaryGreen),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              if (Get.isDialogOpen ?? false) {
                Navigator.of(Get.context!, rootNavigator: true).pop();
              }
              _isDialogShowing = false;
            },
            child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
          ),
        ],
      ),
      barrierDismissible: false,
    ).then((_) => _isDialogShowing = false);
  }

  static void showSuccessSnackbar({required String title, required String message}) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green.withOpacity(0.8),
      colorText: Colors.white,
      icon: const Icon(Icons.check_circle_outline, color: Colors.white),
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      duration: const Duration(seconds: 3),
    );
  }

  static void showErrorSnackbar({required String title, required String message}) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.withOpacity(0.8),
      colorText: Colors.white,
      icon: const Icon(Icons.error_outline, color: Colors.white),
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      duration: const Duration(seconds: 4),
    );
  }
}
