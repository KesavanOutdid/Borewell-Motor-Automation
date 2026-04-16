import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/services/notification_storage_service.dart';
import '../../../../../utils/ui_utils.dart';

class NotificationController extends GetxController {
  final NotificationStorageService _storageService = NotificationStorageService();
  
  var notifications = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  Timer? _refreshTimer;

  @override
  void onInit() {
    super.onInit();
    loadNotifications();
    _startAutoRefresh();
  }

  @override
  void onClose() {
    _refreshTimer?.cancel();
    super.onClose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      loadNotifications();
    });
  }

  Future<void> loadNotifications() async {
    isLoading.value = true;
    notifications.value = _storageService.getAllNotifications();
    isLoading.value = false;
  }

  int getUnreadCount() {
    return _storageService.getUnreadCount();
  }

  Future<void> markAsRead(String notificationId) async {
    await _storageService.markAsRead(notificationId);
    loadNotifications();
  }

  Future<void> markAllAsRead() async {
    final unreadCount = getUnreadCount();
    if (unreadCount > 0) {
      await _storageService.markAllAsRead();
      loadNotifications();
      UIUtils.showSuccessSnackbar(
        title: 'Success',
        message: 'All notifications marked as read',
      );
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    await _storageService.deleteNotification(notificationId);
    loadNotifications();
  }

  Future<void> clearAll() async {
    await _storageService.clearAllNotifications();
    loadNotifications();
  }

  Color getNotificationColor(String type) {
    switch (type) {
      case 'motor_running':
        return const Color(0xFF4CAF50);
      case 'motor_stopped':
        return const Color(0xFFF44336);
      case 'alert':
        return const Color(0xFFFF9800);
      default:
        return const Color(0xFF2196F3);
    }
  }

  IconData getNotificationIcon(String type) {
    switch (type) {
      case 'motor_running':
        return Icons.play_circle_filled;
      case 'motor_stopped':
        return Icons.stop_circle;
      case 'alert':
        return Icons.warning_amber;
      default:
        return Icons.notifications;
    }
  }
}
