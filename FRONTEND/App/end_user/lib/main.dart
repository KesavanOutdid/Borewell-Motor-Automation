import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'core/routes/app_routes.dart';
import 'core/services/token_service.dart';
import 'core/services/permission_service.dart';
import 'core/services/notification_storage_service.dart';
import 'core/services/notification_service.dart';
import 'utils/theme/theme_controller.dart';
import 'utils/theme/app_theme.dart';
import 'feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'feature/end_user_app/auth/presentation/controllers/auth_controller.dart';

Future<void> _updateLocalCache(Map<String, dynamic> data) async {
  if (data['serial_number'] == null) return;
  final serial = data['serial_number'].toString();
  final storage = GetStorage();
  
  // Update Device Details Cache for sync
  final cache = storage.read('device_details_cache') ?? {};
  final Map<String, dynamic> deviceCache = Map<String, dynamic>.from(cache);
  
  final telemetryData = Map<String, dynamic>.from(deviceCache[serial] ?? {});
  
  // Helper to format metric with same logic as Controller
  String stripTrailingZeros(String value) {
    if (!value.contains('.')) return value;
    var trimmed = value.replaceAll(RegExp(r'0+$'), '');
    if (trimmed.endsWith('.')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed.isEmpty ? '0' : trimmed;
  }

  String? format(dynamic val, {String suffix = ''}) {
    if (val == null || val.toString().isEmpty) return null;
    final parsed = double.tryParse(val.toString());
    if (parsed == null) return val.toString();
    final str = stripTrailingZeros(parsed.toStringAsFixed(3));
    return suffix.isEmpty ? str : '$str$suffix';
  }

  // Update with new data from FCM - store raw values for consistent formatting
  if (data['motor_rpm'] != null) telemetryData['motor_rpm'] = data['motor_rpm'];
  if (data['motor_frequency_hz'] != null) telemetryData['motor_frequency_hz'] = data['motor_frequency_hz'];
  if (data['voltage_rms'] != null) telemetryData['motor_voltage'] = data['voltage_rms'];
  if (data['energy_kwh'] != null) telemetryData['energy_kwh'] = data['energy_kwh'];
  if (data['power_kw'] != null) telemetryData['power_kw'] = data['power_kw'];
  if (data['device_temp_c'] != null) telemetryData['device_temp_c'] = data['device_temp_c'];
  if (data['flow_lpm'] != null) telemetryData['flow_lpm'] = data['flow_lpm'];
  if (data['signal_strength'] != null) telemetryData['signal_strength'] = data['signal_strength'];
  if (data['alert'] != null) telemetryData['alert'] = data['alert'];

  if (data['motor_running'] != null && data['motor_running'].toString().isNotEmpty) {
    final isRunning = data['motor_running'].toString().toLowerCase() == 'true' || data['action'] == 'START';
    telemetryData['motorStatus'] = isRunning ? 'Running' : 'Stopped';
    telemetryData['deviceStatus'] = isRunning ? 'Running' : 'Ready';
  }

  telemetryData['lastUpdate'] = data['timestamp'] != null ? data['timestamp'].toString() : DateTime.now().toIso8601String();
  
  deviceCache[serial] = telemetryData;
  await storage.write('device_details_cache', deviceCache);

  // Update assigned_devices list for Home Page
  final devicesData = storage.read('assigned_devices');
  if (devicesData != null) {
    List<dynamic> devices = List.from(devicesData);
    int idx = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
    if (idx != -1) {
      var device = Map<String, dynamic>.from(devices[idx]);
      device.addAll(telemetryData);
      if (data['motor_running'] != null && data['motor_running'].toString().isNotEmpty) {
        device['start_status'] = data['motor_running'].toString().toLowerCase() == 'true' || data['action'] == 'START';
      }
      devices[idx] = device;
      await storage.write('assigned_devices', devices);
    }
  }
  print("✅ [FCM Cache] Updated cache for $serial");
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await GetStorage.init();
  print("🔥 [FCM Background] Got message: ${message.notification?.title}");
  print("🔥 [FCM Background] Data payload: ${message.data}");
  
  final data = message.data;
  if (data['serial_number'] != null) {
    // Map type for better UI icon/color
    String type = 'notification';
    if (data['type'] == 'STATUS') {
      type = data['action'] == 'START' ? 'motor_running' : 'motor_stopped';
    } else if (data['type'] == 'ALERT') {
      type = 'alert';
    }

    await NotificationStorageService().saveNotification(
      type: type,
      title: message.notification?.title ?? "Notification",
      body: message.notification?.body ?? "",
      serialNumber: data['serial_number'].toString(),
      timestamp: data['timestamp'],
    );
    
    await _updateLocalCache(data);
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

    // Initialize Local Notifications via NotificationService
    final notificationService = NotificationService();
    await notificationService.setupNotifications();

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      print("🔔 [FCM Foreground] Got message: ${message.notification?.title}");
      print("🔔 [FCM Foreground] Data payload: ${message.data}");
      
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      // If `onMessage` is triggered with a notification, show it manually
      if (notification != null && android != null) {
        notificationService.showNotification(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          payload: jsonEncode(message.data),
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
          serialNumber: message.data['serial_number'].toString(),
          timestamp: message.data['timestamp'],
        );
        
        await _updateLocalCache(message.data);
        
        // Refresh Home/Details if active
        try {
          if (Get.isRegistered<HomeController>()) {
            Get.find<HomeController>().devices.refresh();
          }
        } catch (_) {}
        
        print("✅ [FCM Foreground] Notification saved and cache updated");
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
            onTap: (_) {
              notificationService.handleNotificationClick(jsonEncode(message.data));
            },
          );
        }
      }
    });

    // Handle interaction when app is in background but opened via notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('🖱️ [FCM Interaction] Notification caused app to open: ${message.data}');
      notificationService.handleNotificationClick(jsonEncode(message.data));
    });

    // Check if the app was opened from a terminated state via FCM notification
    RemoteMessage? initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      print('🖱️ [FCM Interaction] App opened from terminated state: ${initialMessage.data}');
      // Wait a bit for the app to settle before navigating
      Future.delayed(const Duration(seconds: 1), () {
        notificationService.handleNotificationClick(jsonEncode(initialMessage.data));
      });
    }

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
