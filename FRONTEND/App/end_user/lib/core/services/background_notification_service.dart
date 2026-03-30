// =============================================================================
// COMMENTED OUT: BackgroundNotificationService
// =============================================================================
// This entire service has been disabled because:
// 1. It creates duplicate Socket.IO connections per device (runs in a separate isolate)
// 2. FCM already handles all background notifications (motor status, alerts)
// 3. The 5-second polling loop was consuming battery unnecessarily
//
// The centralized SocketService now handles all real-time events in the main app.
// If everything works fine without this, remove this file entirely.
// =============================================================================

// import 'dart:async';
// import 'dart:convert';
// import 'dart:ui';
// import 'package:flutter/widgets.dart';
// import 'package:flutter_background_service/flutter_background_service.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// import 'package:get_storage/get_storage.dart';
// import 'package:socket_io_client/socket_io_client.dart' as IO;
// import '../config/env.dart';

// @pragma('vm:entry-point')
// class BackgroundNotificationService {
//   @pragma('vm:entry-point')
//   static Future<void> initialize() async {
//     final service = FlutterBackgroundService();
//     
//     const androidNotificationChannel = AndroidNotificationChannel(
//       'background_service',
//       'Background Service',
//       description: 'Keeps app connected for real-time notifications',
//       importance: Importance.low,
//     );
//
//     final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
//     
//     await flutterLocalNotificationsPlugin
//         .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
//         ?.createNotificationChannel(androidNotificationChannel);
//
//     await service.configure(
//       androidConfiguration: AndroidConfiguration(
//         onStart: onStart,
//         autoStart: true,
//         isForegroundMode: true,
//         notificationChannelId: 'background_service',
//         initialNotificationTitle: 'AgriPlus',
//         initialNotificationContent: 'Monitoring devices',
//         foregroundServiceNotificationId: 888,
//       ),
//       iosConfiguration: IosConfiguration(
//         autoStart: true,
//         onForeground: onStart,
//         onBackground: onIosBackground,
//       ),
//     );
//     
//     await service.startService();
//   }
//
//   @pragma('vm:entry-point')
//   static Future<bool> onIosBackground(ServiceInstance service) async {
//     WidgetsFlutterBinding.ensureInitialized();
//     DartPluginRegistrant.ensureInitialized();
//     return true;
//   }
//
//   @pragma('vm:entry-point')
//   static void onStart(ServiceInstance service) async {
//     DartPluginRegistrant.ensureInitialized();
//     await GetStorage.init();
//     
//     final storage = GetStorage();
//     
//     if (service is AndroidServiceInstance) {
//       service.on('stopService').listen((event) {
//         service.stopSelf();
//       });
//
//       service.setAsForegroundService();
//     }
//
//     final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
//     
//     const motorStatusChannel = AndroidNotificationChannel(
//       'motor_status',
//       'Motor Status',
//       description: 'Persistent notifications for motor running status',
//       importance: Importance.high,
//       playSound: true,
//       enableVibration: true,
//     );
//
//     const alertChannel = AndroidNotificationChannel(
//       'device_alerts',
//       'Device Alerts',
//       description: 'Notifications for device alerts and warnings',
//       importance: Importance.high,
//       playSound: true,
//       enableVibration: true,
//     );
//
//     await flutterLocalNotificationsPlugin
//         .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
//         ?.createNotificationChannel(motorStatusChannel);
//
//     await flutterLocalNotificationsPlugin
//         .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
//         ?.createNotificationChannel(alertChannel);
//
//     const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
//     const initSettings = InitializationSettings(android: androidSettings);
//     await flutterLocalNotificationsPlugin.initialize(
//       settings: initSettings,
//     );
//
//     Map<String, IO.Socket> sockets = {};
//     Map<String, bool> previousMotorStates = {};
//
//     Timer.periodic(const Duration(seconds: 5), (timer) async {
//       if (service is! AndroidServiceInstance) return;
//       if (!await service.isForegroundService()) return;
//
//       final token = storage.read('auth_token');
//       if (token == null || token.isEmpty) {
//         return;
//       }
//
//       final devicesData = storage.read('assigned_devices');
//       if (devicesData == null) return;
//
//       List<dynamic> devices = devicesData is List ? devicesData : [];
//       
//       for (var device in devices) {
//         final serialNumber = device['serial_number'] ?? device['serialNumber'];
//         if (serialNumber == null) continue;
//
//         if (!sockets.containsKey(serialNumber) || sockets[serialNumber]?.connected != true) {
//           try {
//             final socket = IO.io(AppConfig.socketIOUrl, <String, dynamic>{
//               'transports': ['websocket'],
//               'autoConnect': false,
//               'query': {
//                 'token': token,
//                 'serial_number': serialNumber,
//               }
//             });
//
//             socket.on('connect', (_) {
//               // Connected
//             });
//
//             socket.on('disconnect', (_) {
//               sockets.remove(serialNumber);
//             });
//
//             socket.on('LIVE_STATUS', (data) async {
//               // ... status handling ...
//             });
//
//             socket.on('LIVE_ALERT', (data) async {
//               // ... alert handling ...
//             });
//
//             socket.on('LIVE_TELEMETRY', (data) async {
//               // ... telemetry handling ...
//             });
//
//             socket.connect();
//             sockets[serialNumber] = socket;
//           } catch (e) {
//             // Failed to connect
//           }
//         }
//       }
//     });
//   }
//
//   static Future<void> _showMotorRunningNotification(...) async { ... }
//   static Future<void> _showMotorStoppedNotification(...) async { ... }
//   static Future<void> _showAlertNotification(...) async { ... }
//   static Future<void> _saveNotification(...) async { ... }
//
//   static Future<void> stopService() async {
//     final service = FlutterBackgroundService();
//     service.invoke('stopService');
//   }
// }
