import 'package:permission_handler/permission_handler.dart';
import 'package:geolocator/geolocator.dart';

class PermissionService {
  Future<Map<String, bool>> requestAllPermissions() async {
    Map<String, bool> permissionStatuses = {
      'notification': false,
      'location': false,
      'camera': false,
    };

    final notificationStatus = await Permission.notification.request();
    permissionStatuses['notification'] = notificationStatus.isGranted;

    final locationStatus = await Permission.location.request();
    permissionStatuses['location'] = locationStatus.isGranted;

    final cameraStatus = await Permission.camera.request();
    permissionStatuses['camera'] = cameraStatus.isGranted;

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

  Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.request();
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

  Future<bool> checkCameraPermission() async {
    final status = await Permission.camera.status;
    return status.isGranted;
  }

  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  Future<PermissionStatus> getNotificationPermissionStatus() async {
    return await Permission.notification.status;
  }

  Future<PermissionStatus> getLocationPermissionStatus() async {
    return await Permission.location.status;
  }

  Future<PermissionStatus> getCameraPermissionStatus() async {
    return await Permission.camera.status;
  }

  Future<void> openSettings() async {
    await openAppSettings();
  }
}
