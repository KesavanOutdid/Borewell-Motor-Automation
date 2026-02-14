import 'package:get_storage/get_storage.dart';

class NotificationStorageService {
  static final NotificationStorageService _instance = NotificationStorageService._internal();
  factory NotificationStorageService() => _instance;
  NotificationStorageService._internal();

  final _storage = GetStorage();
  static const String _notificationsKey = 'notifications_history';
  static const int _maxAgeDays = 7;

  Future<void> initialize() async {
    await cleanupOldNotifications();
  }

  Future<void> saveNotification({
    required String type,
    required String title,
    required String body,
    required String serialNumber,
    String? timestamp,
  }) async {
    print("📦 [Storage] Saving notification: $title");
    final notifications = getAllNotifications();
    
    // Format timestamp if it's a numeric string
    String formattedTimestamp = timestamp ?? DateTime.now().toIso8601String();
    if (timestamp != null && RegExp(r'^\d+$').hasMatch(timestamp)) {
      try {
        final ms = int.parse(timestamp);
        final date = DateTime.fromMillisecondsSinceEpoch(ms);
        formattedTimestamp = "${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}";
      } catch (e) {
        print("📦 [Storage] Timestamp parse error: $e");
      }
    }

    final notification = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'type': type,
      'title': title,
      'body': body,
      'serialNumber': serialNumber,
      'timestamp': formattedTimestamp,
      'isRead': false,
      'createdAt': DateTime.now().toIso8601String(),
    };

    notifications.insert(0, notification);
    await _storage.write(_notificationsKey, notifications);
    print("📦 [Storage] Notification saved. Total count: ${notifications.length}");
  }

  List<Map<String, dynamic>> getAllNotifications() {
    try {
      final data = _storage.read(_notificationsKey);
      if (data == null) {
        print("📦 [Storage] No notifications found in storage");
        return [];
      }
      final list = List<dynamic>.from(data);
      final result = list.map((item) => Map<String, dynamic>.from(item)).toList();
      print("📦 [Storage] Loaded ${result.length} notifications");
      return result;
    } catch (e) {
      print("📦 [Storage] Error reading notifications: $e");
      return [];
    }
  }

  List<Map<String, dynamic>> getUnreadNotifications() {
    final notifications = getAllNotifications();
    return notifications.where((n) => n['isRead'] == false).toList();
  }

  int getUnreadCount() {
    return getUnreadNotifications().length;
  }

  Future<void> markAsRead(String notificationId) async {
    final notifications = getAllNotifications();
    final index = notifications.indexWhere((n) => n['id'] == notificationId);
    
    if (index != -1) {
      notifications[index]['isRead'] = true;
      await _storage.write(_notificationsKey, notifications);
    }
  }

  Future<void> markAllAsRead() async {
    final notifications = getAllNotifications();
    for (var notification in notifications) {
      notification['isRead'] = true;
    }
    await _storage.write(_notificationsKey, notifications);
  }

  Future<void> deleteNotification(String notificationId) async {
    final notifications = getAllNotifications();
    notifications.removeWhere((n) => n['id'] == notificationId);
    await _storage.write(_notificationsKey, notifications);
  }

  Future<void> clearAllNotifications() async {
    await _storage.write(_notificationsKey, []);
  }

  Future<void> cleanupOldNotifications() async {
    final notifications = getAllNotifications();
    final cutoffDate = DateTime.now().subtract(Duration(days: _maxAgeDays));
    
    final filtered = notifications.where((notification) {
      final createdAt = DateTime.parse(notification['createdAt']);
      return createdAt.isAfter(cutoffDate);
    }).toList();

    if (filtered.length != notifications.length) {
      await _storage.write(_notificationsKey, filtered);
    }
  }

  List<Map<String, dynamic>> getNotificationsBySerialNumber(String serialNumber) {
    final notifications = getAllNotifications();
    return notifications.where((n) => n['serialNumber'] == serialNumber).toList();
  }
}
