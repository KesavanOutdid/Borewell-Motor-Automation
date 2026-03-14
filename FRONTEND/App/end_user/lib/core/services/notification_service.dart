import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../../feature/end_user_app/home/presentation/controllers/home_controller.dart';
import '../routes/app_routes.dart';
import 'notification_storage_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  final NotificationStorageService _storageService = NotificationStorageService();
  bool _initialized = false;

  Future<void> setupNotifications() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);

    await _notifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        if (details.payload != null) {
          handleNotificationClick(details.payload!);
        }
      },
    );

    const motorStatusChannel = AndroidNotificationChannel(
      'motor_status',
      'Motor Status',
      description: 'Persistent notifications for motor running status',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    const alertChannel = AndroidNotificationChannel(
      'device_alerts',
      'Device Alerts',
      description: 'Notifications for device alerts and warnings',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(motorStatusChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(alertChannel);

    _initialized = true;

    // Handle initial notification if app was opened from terminated state
    final NotificationAppLaunchDetails? launchDetails =
        await _notifications.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp ?? false) {
      if (launchDetails?.notificationResponse?.payload != null) {
        // Wait a bit for the app to settle before navigating
        Future.delayed(const Duration(seconds: 1), () {
          handleNotificationClick(launchDetails!.notificationResponse!.payload!);
        });
      }
    }
  }

  void handleNotificationClick(String payload) {
    print('🖱️ [Notification Interaction] Payload: $payload');
    try {
      final Map<String, dynamic> data = jsonDecode(payload);
      final String? type = data['type'];
      final String? serialNumber = data['serial_number'] ?? data['serialNumber'];

      if (type == 'ACCESS_REQUEST') {
        // Redirect to Home with Access filter
        Get.offAllNamed(AppRoutes.home);
        // Robustly wait for HomeController to be ready
        _retrySetFilter('Access');
        return;
      }

      if (type == 'SCHEDULE' || type == 'SCHEDULE_CANCEL') {
        if (serialNumber != null && serialNumber.isNotEmpty) {
          Get.toNamed(AppRoutes.deviceSchedule, arguments: {
            'serial_number': serialNumber,
            'imei_number': data['imei_number'] ?? data['imeiNumber'],
          });
          return;
        }
      }

      if (type == 'SHARE_RESPONSE') {
        if (serialNumber != null && serialNumber.isNotEmpty) {
          Get.toNamed(AppRoutes.deviceSharing, arguments: {
            'serial_number': serialNumber,
          });
          return;
        }
      }

      if (serialNumber != null && serialNumber.isNotEmpty) {
        Get.toNamed(AppRoutes.deviceDetails, arguments: {
          'serial_number': serialNumber,
          'imei_number': data['imei_number'] ?? data['imeiNumber'],
        });
      } else {
        Get.toNamed(AppRoutes.notifications);
      }
    } catch (e) {
      print('❌ [Notification Interaction] Error parsing payload: $e');
      // If it's not JSON, assume it's a serial number (legacy or simple case)
      if (payload.isNotEmpty && !payload.startsWith('{')) {
        Get.toNamed(AppRoutes.deviceDetails, arguments: {
          'serial_number': payload,
        });
      } else {
        Get.toNamed(AppRoutes.notifications);
      }
    }
  }

  Future<void> showNotification({
    int id = 0,
    String? title,
    String? body,
    String? payload,
    String channelId = 'high_importance_channel',
    String channelName = 'High Importance Notifications',
  }) async {
    await setupNotifications();

    final androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      importance: Importance.max,
      priority: Priority.max,
    );

    final details = NotificationDetails(android: androidDetails);

    await _notifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }

  Future<void> showMotorRunningNotification({
    required String serialNumber,
    String? startTime,
  }) async {
    await setupNotifications();

    final androidDetails = AndroidNotificationDetails(
      'motor_status',
      'Motor Status',
      channelDescription: 'Persistent notifications for motor running status',
      importance: Importance.max,
      priority: Priority.max,
      ongoing: true,
      autoCancel: false,
      showWhen: true,
      when: DateTime.now().millisecondsSinceEpoch,
      playSound: true,
      enableVibration: true,
      channelShowBadge: true,
      visibility: NotificationVisibility.public,
    );

    final details = NotificationDetails(android: androidDetails);

    final title = '🟢 Motor Running';
    final body = 'Device: $serialNumber${startTime != null ? '\nStarted: $startTime' : ''}';

    final payload = jsonEncode({
      'type': 'motor_running',
      'serial_number': serialNumber,
      'timestamp': startTime,
    });

    await _notifications.show(
      id: serialNumber.hashCode,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );

    await _storageService.saveNotification(
      type: 'motor_running',
      title: title,
      body: body,
      serialNumber: serialNumber,
      timestamp: startTime,
    );
  }

  Future<void> showMotorStoppedNotification({
    required String serialNumber,
    String? stopTime,
  }) async {
    await setupNotifications();

    await cancelNotification(serialNumber);

    final androidDetails = AndroidNotificationDetails(
      'motor_status',
      'Motor Status',
      channelDescription: 'Notifications for motor stopped status',
      importance: Importance.max,
      priority: Priority.max,
      ongoing: false,
      autoCancel: true,
      playSound: true,
      enableVibration: true,
      channelShowBadge: true,
      visibility: NotificationVisibility.public,
    );

    final details = NotificationDetails(android: androidDetails);

    final title = '🔴 Motor Stopped';
    final body = 'Device: $serialNumber${stopTime != null ? '\nStopped: $stopTime' : ''}';

    final payload = jsonEncode({
      'type': 'motor_stopped',
      'serial_number': serialNumber,
      'timestamp': stopTime,
    });

    await _notifications.show(
      id: serialNumber.hashCode + 1,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );

    await _storageService.saveNotification(
      type: 'motor_stopped',
      title: title,
      body: body,
      serialNumber: serialNumber,
      timestamp: stopTime,
    );
  }

  Future<void> showAlertNotification({
    required String serialNumber,
    required String alertMessage,
    String? timestamp,
    String? deviceStatus,
  }) async {
    await setupNotifications();

    final androidDetails = AndroidNotificationDetails(
      'device_alerts',
      'Device Alerts',
      channelDescription: 'Notifications for device alerts and warnings',
      importance: Importance.max,
      priority: Priority.max,
      ongoing: false,
      autoCancel: true,
      playSound: true,
      enableVibration: true,
      channelShowBadge: true,
      visibility: NotificationVisibility.public,
      color: const Color(0xFFFF0000),
    );

    final details = NotificationDetails(android: androidDetails);

    String statusEmoji = '⚠️';
    if (deviceStatus != null) {
      final status = deviceStatus.toLowerCase();
      if (status.contains('critical') || status.contains('error')) {
        statusEmoji = '🔴';
      } else if (status.contains('warning')) {
        statusEmoji = '⚠️';
      } else if (status.contains('normal') || status.contains('ok')) {
        statusEmoji = '🟢';
      }
    }

    final title = '$statusEmoji Device Alert - $serialNumber';
    final body = '$alertMessage${timestamp != null ? '\nTime: $timestamp' : ''}';

    final payload = jsonEncode({
      'type': 'alert',
      'serial_number': serialNumber,
      'timestamp': timestamp,
      'status': deviceStatus,
    });

    await _notifications.show(
      id: serialNumber.hashCode + 999,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );

    await _storageService.saveNotification(
      type: 'alert',
      title: title,
      body: body,
      serialNumber: serialNumber,
      timestamp: timestamp,
    );
  }

  Future<void> cancelNotification(String serialNumber) async {
    await _notifications.cancel(id: serialNumber.hashCode);
  }

  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  void _retrySetFilter(String filter, {int attempts = 0}) {
    if (Get.isRegistered<HomeController>()) {
      Get.find<HomeController>().setFilter(filter);
    } else if (attempts < 10) {
      // Retry every 200ms for up to 2 seconds
      Future.delayed(const Duration(milliseconds: 200), () {
        _retrySetFilter(filter, attempts: attempts + 1);
      });
    }
  }
}
