import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get_storage/get_storage.dart';
import 'package:web_socket_channel/io.dart';
import '../config/env.dart';

class BackgroundNotificationService {
  static Future<void> initialize() async {
    final service = FlutterBackgroundService();
    
    const androidNotificationChannel = AndroidNotificationChannel(
      'background_service',
      'Background Service',
      description: 'Keeps app connected for real-time notifications',
      importance: Importance.low,
    );

    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidNotificationChannel);

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: true,
        isForegroundMode: true,
        notificationChannelId: 'background_service',
        initialNotificationTitle: 'Auto Harvest',
        initialNotificationContent: 'Monitoring devices',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
    
    await service.startService();
  }

  @pragma('vm:entry-point')
  static Future<bool> onIosBackground(ServiceInstance service) async {
    WidgetsFlutterBinding.ensureInitialized();
    DartPluginRegistrant.ensureInitialized();
    return true;
  }

  @pragma('vm:entry-point')
  static void onStart(ServiceInstance service) async {
    DartPluginRegistrant.ensureInitialized();
    await GetStorage.init();
    
    final storage = GetStorage();
    
    if (service is AndroidServiceInstance) {
      service.on('stopService').listen((event) {
        service.stopSelf();
      });

      service.setAsForegroundService();
    }

    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    
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

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(motorStatusChannel);

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(alertChannel);

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await flutterLocalNotificationsPlugin.initialize(initSettings);

    Map<String, IOWebSocketChannel> channels = {};
    Map<String, StreamSubscription> subscriptions = {};
    Map<String, bool> previousMotorStates = {};

    Timer.periodic(const Duration(seconds: 5), (timer) async {
      if (service is! AndroidServiceInstance) return;
      if (!await service.isForegroundService()) return;

      final token = storage.read('auth_token');
      if (token == null || token.isEmpty) {
        return;
      }

      final devicesData = storage.read('assigned_devices');
      if (devicesData == null) return;

      List<dynamic> devices = devicesData is List ? devicesData : [];
      
      for (var device in devices) {
        final serialNumber = device['serial_number'] ?? device['serialNumber'];
        if (serialNumber == null) continue;

        if (!channels.containsKey(serialNumber)) {
          try {
            final wsUrl = Uri.parse('${AppConfig.websocketUrl}?token=$token&serial_number=$serialNumber');
            final channel = IOWebSocketChannel.connect(wsUrl);
            channels[serialNumber] = channel;

            final subscription = channel.stream.listen(
              (message) async {
                try {
                  final data = jsonDecode(message);
                  final event = data['event'];
                  
                  if (event == 'LIVE_STATUS') {
                    final payload = data['payload'];
                    if (payload is Map) {
                      final running = payload['motor_running'] == true;
                      final previousState = previousMotorStates[serialNumber];
                      
                      if (running && (previousState == false || previousState == null)) {
                        await _showMotorRunningNotification(
                          flutterLocalNotificationsPlugin,
                          serialNumber,
                          storage,
                        );
                      } else if (!running && previousState == true) {
                        await _showMotorStoppedNotification(
                          flutterLocalNotificationsPlugin,
                          serialNumber,
                          storage,
                        );
                      }
                      
                      previousMotorStates[serialNumber] = running;
                    }
                  } else if (event == 'LIVE_ALERT') {
                    final payload = data['payload'];
                    if (payload is Map) {
                      final alertType = payload['alert_type']?.toString() ?? '';
                      final deviceStatus = payload['device_status']?.toString() ?? '';
                      final description = payload['description']?.toString() ?? '';
                      
                      String alertMessage = 'Device Alert';
                      if (alertType.isNotEmpty) {
                        alertMessage = 'Type: $alertType';
                      }
                      if (deviceStatus.isNotEmpty) {
                        alertMessage += '\nStatus: $deviceStatus';
                      }
                      if (description.isNotEmpty) {
                        alertMessage += '\n$description';
                      }
                      
                      await _showAlertNotification(
                        flutterLocalNotificationsPlugin,
                        serialNumber,
                        alertMessage,
                        deviceStatus,
                        storage,
                      );
                    }
                  } else if (event == 'LIVE_TELEMETRY') {
                    final payload = data['payload'];
                    if (payload is Map && payload['fault_code'] != null) {
                      final faultCode = payload['fault_code'].toString();
                      if (faultCode != '-' && faultCode.isNotEmpty && faultCode != '0') {
                        await _showAlertNotification(
                          flutterLocalNotificationsPlugin,
                          serialNumber,
                          'Fault Code: $faultCode',
                          'Warning',
                          storage,
                        );
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              },
              onDone: () {
                channels.remove(serialNumber);
                subscriptions.remove(serialNumber);
                previousMotorStates.remove(serialNumber);
              },
              onError: (error) {
                channels.remove(serialNumber);
                subscriptions.remove(serialNumber);
                previousMotorStates.remove(serialNumber);
              },
            );
            
            subscriptions[serialNumber] = subscription;
          } catch (e) {
            // Failed to connect
          }
        }
      }
    });
  }

  static Future<void> _showMotorRunningNotification(
    FlutterLocalNotificationsPlugin plugin,
    String serialNumber,
    GetStorage storage,
  ) async {
    final androidDetails = AndroidNotificationDetails(
      'motor_status',
      'Motor Status',
      channelDescription: 'Persistent notifications for motor running status',
      importance: Importance.max,
      priority: Priority.max,
      ongoing: true,
      autoCancel: false,
      playSound: true,
      enableVibration: true,
    );

    final details = NotificationDetails(android: androidDetails);
    final title = '🟢 Motor Running';
    final body = 'Device: $serialNumber\nStarted: ${DateTime.now().toString().substring(0, 19)}';

    await plugin.show(
      serialNumber.hashCode,
      title,
      body,
      details,
    );

    await _saveNotification(storage, 'motor_running', title, body, serialNumber);
  }

  static Future<void> _showMotorStoppedNotification(
    FlutterLocalNotificationsPlugin plugin,
    String serialNumber,
    GetStorage storage,
  ) async {
    await plugin.cancel(serialNumber.hashCode);

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
    );

    final details = NotificationDetails(android: androidDetails);
    final title = '🔴 Motor Stopped';
    final body = 'Device: $serialNumber\nStopped: ${DateTime.now().toString().substring(0, 19)}';

    await plugin.show(
      serialNumber.hashCode + 1,
      title,
      body,
      details,
    );

    await _saveNotification(storage, 'motor_stopped', title, body, serialNumber);
  }

  static Future<void> _showAlertNotification(
    FlutterLocalNotificationsPlugin plugin,
    String serialNumber,
    String alertMessage,
    String deviceStatus,
    GetStorage storage,
  ) async {
    String statusEmoji = '⚠️';
    if (deviceStatus.isNotEmpty) {
      final status = deviceStatus.toLowerCase();
      if (status.contains('critical') || status.contains('error')) {
        statusEmoji = '🔴';
      } else if (status.contains('warning')) {
        statusEmoji = '⚠️';
      } else if (status.contains('normal') || status.contains('ok')) {
        statusEmoji = '🟢';
      }
    }

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
    );

    final details = NotificationDetails(android: androidDetails);
    final title = '$statusEmoji Device Alert - $serialNumber';
    final body = '$alertMessage\nTime: ${DateTime.now().toString().substring(0, 19)}';

    await plugin.show(
      serialNumber.hashCode + 999,
      title,
      body,
      details,
    );

    await _saveNotification(storage, 'alert', title, body, serialNumber);
  }

  static Future<void> _saveNotification(
    GetStorage storage,
    String type,
    String title,
    String body,
    String serialNumber,
  ) async {
    final notifications = storage.read('notifications_history') ?? [];
    final notificationsList = List<Map<String, dynamic>>.from(notifications);
    
    final notification = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'type': type,
      'title': title,
      'body': body,
      'serialNumber': serialNumber,
      'timestamp': DateTime.now().toIso8601String(),
      'isRead': false,
      'createdAt': DateTime.now().toIso8601String(),
    };

    notificationsList.insert(0, notification);
    await storage.write('notifications_history', notificationsList);
  }

  static Future<void> stopService() async {
    final service = FlutterBackgroundService();
    service.invoke('stopService');
  }
}
