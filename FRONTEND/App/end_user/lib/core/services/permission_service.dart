import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  Future<Map<String, bool>> requestAllPermissions() async {
    Map<String, bool> permissionStatuses = {
      'notification': false,
      'location': false,
    };

    final notificationStatus = await Permission.notification.request();
    permissionStatuses['notification'] = notificationStatus.isGranted;

    final locationStatus = await Permission.location.request();
    permissionStatuses['location'] = locationStatus.isGranted;

    return permissionStatuses;
  }

  Future<bool> requestNotificationPermission() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  Future<bool> requestLocationPermission() async {
    final status = await Permission.location.request();
    return status.isGranted;
  }

  Future<bool> checkNotificationPermission() async {
    final status = await Permission.notification.status;
    return status.isGranted;
  }

  Future<bool> checkLocationPermission() async {
    final status = await Permission.location.status;
    return status.isGranted;
  }

  Future<void> openAppSettings() async {
    await openAppSettings();
  }
}
