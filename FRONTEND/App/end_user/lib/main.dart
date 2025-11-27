import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

import 'core/routes/app_routes.dart';
import 'core/services/token_service.dart';
import 'core/services/permission_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/notification_storage_service.dart';
import 'core/services/background_notification_service.dart';
import 'utils/theme/theme_controller.dart';
import 'feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'feature/end_user_app/auth/presentation/controllers/auth_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await GetStorage.init();

  final permissionService = PermissionService();
  await permissionService.requestAllPermissions();

  final notificationStorageService = NotificationStorageService();
  await notificationStorageService.initialize();

  final notificationService = NotificationService();
  await notificationService.initialize();

  await BackgroundNotificationService.initialize();

  // Existing controllers
  Get.put(await TokenService().init());
  Get.put(ThemeController());

  // 🔥 REQUIRED — Fix for Null Check Crash
  Get.put(LoginController(), permanent: true);
  Get.put(HomeController(), permanent: true);

  runApp(
    GetMaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.splash,
      getPages: AppRoutes.routes,
      themeMode: Get.find<ThemeController>().themeMode,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        primaryColor: Colors.green[600],
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.green[600],
          foregroundColor: Colors.white,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: Colors.green[600],
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.grey[900],
          foregroundColor: Colors.white,
        ),
      ),
    ),
  );
}
