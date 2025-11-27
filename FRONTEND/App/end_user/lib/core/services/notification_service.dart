import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'notification_storage_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  final NotificationStorageService _storageService = NotificationStorageService();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {},
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
  }

  Future<void> showMotorRunningNotification({
    required String serialNumber,
    String? startTime,
  }) async {
    await initialize();

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

    await _notifications.show(
      serialNumber.hashCode,
      title,
      body,
      details,
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
    await initialize();

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

    await _notifications.show(
      serialNumber.hashCode + 1,
      title,
      body,
      details,
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
    await initialize();

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

    await _notifications.show(
      serialNumber.hashCode + 999,
      title,
      body,
      details,
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
    await _notifications.cancel(serialNumber.hashCode);
  }

  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }
}
