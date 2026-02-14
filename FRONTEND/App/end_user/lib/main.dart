import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'core/routes/app_routes.dart';
import 'core/services/token_service.dart';
import 'core/services/permission_service.dart';
import 'core/services/notification_storage_service.dart';
import 'utils/theme/theme_controller.dart';
import 'utils/theme/app_theme.dart';
import 'feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'feature/end_user_app/auth/presentation/controllers/auth_controller.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'high_importance_channel', // id
  'High Importance Notifications', // title
  description: 'This channel is used for important notifications.', // description
  importance: Importance.max,
);

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await GetStorage.init();
  print("🔥 [FCM Background] Got message: ${message.notification?.title}");
  print("🔥 [FCM Background] Data payload: ${message.data}");
  
  if (message.data['serial_number'] != null) {
    // Map type for better UI icon/color
    String type = 'notification';
    if (message.data['type'] == 'STATUS') {
      type = message.data['action'] == 'START' ? 'motor_running' : 'motor_stopped';
    } else if (message.data['type'] == 'ALERT') {
      type = 'alert';
    }

    await NotificationStorageService().saveNotification(
      type: type,
      title: message.notification?.title ?? "Notification",
      body: message.notification?.body ?? "",
      serialNumber: message.data['serial_number'],
      timestamp: message.data['timestamp'],
    );
    print("✅ [FCM Background] Notification saved successfully");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Firebase
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    print("✅ [Firebase] Initialized");
    
    // Request permission for push notifications
    final messaging = FirebaseMessaging.instance;
    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('🔔 [Firebase] User granted permission: ${settings.authorizationStatus}');

    // Initialize Local Notifications
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      print("🔔 [FCM Foreground] Got message: ${message.notification?.title}");
      print("🔔 [FCM Foreground] Data payload: ${message.data}");
      
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      // If `onMessage` is triggered with a notification, show it manually
      if (notification != null && android != null) {
        flutterLocalNotificationsPlugin.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: android.smallIcon,
              // other properties...
            ),
          ),
        );
      }
      
      if (message.data['serial_number'] != null) {
        // Map type for better UI icon/color
        String type = 'notification';
        if (message.data['type'] == 'STATUS') {
          type = message.data['action'] == 'START' ? 'motor_running' : 'motor_stopped';
        } else if (message.data['type'] == 'ALERT') {
          type = 'alert';
        }

        print("🔔 [FCM Foreground] Saving notification of type: $type for ${message.data['serial_number']}");
        
        await NotificationStorageService().saveNotification(
          type: type,
          title: message.notification?.title ?? "Notification",
          body: message.notification?.body ?? "",
          serialNumber: message.data['serial_number'],
          timestamp: message.data['timestamp'],
        );
        print("✅ [FCM Foreground] Notification saved successfully");
      }

      if (message.notification != null) {
        // Safe check for Overlay before showing snackbar
        if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
          Get.snackbar(
            message.notification!.title ?? "Notification",
            message.notification!.body ?? "",
            snackPosition: SnackPosition.TOP,
            backgroundColor: Colors.white.withOpacity(0.9),
            margin: const EdgeInsets.all(10),
            duration: const Duration(seconds: 4),
          );
        }
      }
    });

    // Handle interaction when app is in background but opened via notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('🖱️ [FCM Interaction] Notification caused app to open: ${message.data}');
    });

  } catch (e) {
    print("❌ [Firebase] Initialization failed: $e");
  }

  // 2. Initialize Storage First (required by other services)
  await GetStorage.init();

  // 2. Run remaining initializations in parallel
  await Future.wait([
    PermissionService().requestAllPermissions(),
    NotificationStorageService().initialize(),
  ]);

  // 3. Setup Services & Controllers
  Get.put(TokenService()); // No need to await if init() just returns this
  Get.lazyPut(() => ThemeController());

  // 🔥 REQUIRED — Fix for Null Check Crash
  Get.lazyPut(() => AuthController(), fenix: true);
  Get.lazyPut(() => HomeController(), fenix: true);

  runApp(
    GetMaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.splash,
      getPages: AppRoutes.routes,
      themeMode: Get.find<ThemeController>().themeMode,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
    ),
  );
}
