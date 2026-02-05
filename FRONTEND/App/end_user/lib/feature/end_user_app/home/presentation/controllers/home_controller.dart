import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:geocoding/geocoding.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../device/presentation/pages/qr_scanner_page.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:socket_io_client/socket_io_client.dart' as IO;

class HomeController extends GetxController {
  var devices = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  var selectedFilter = 'Recently'.obs;
  late TokenService tokenService;
  final _storage = GetStorage();
  IO.Socket? _socket;
  Timer? _offlineCheckTimer;

  void setFilter(String filter) {
    selectedFilter.value = filter;
  }

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  @override
  void onClose() {
    _socket?.dispose();
    _offlineCheckTimer?.cancel();
    super.onClose();
  }

  void _initSocket() {
    try {
      final token = tokenService.getToken();
      _socket = IO.io(AppConfig.socketIOUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'query': {'token': token}
      });

      _socket!.onConnect((_) => print('🏠 Home Socket Connected'));
      _socket!.onDisconnect((_) => print('🏠 Home Socket Disconnected'));

      _socket!.on('LIVE_STATUS', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          final payload = data['payload'];
          _updateDeviceLastSeen(serial);
          if (payload != null) {
            final newStatus = payload['motor_running'] == true;
            _updateDeviceStatus(serial, newStatus);
          }
        }
      });

      _socket!.on('LIVE_TELEMETRY', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          _updateDeviceLastSeen(serial);
        }
      });

      _socket!.on('LIVE_HEARTBEAT', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          _updateDeviceLastSeen(serial);
        }
      });
    } catch (e) {
      print('🏠 Home Socket Error: $e');
    }
  }

  void _updateDeviceLastSeen(String serial) {
    int index = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
    if (index != -1) {
      var device = Map<String, dynamic>.from(devices[index]);
      device['updatedAt'] = DateTime.now().toIso8601String();
      devices[index] = device;
      devices.refresh();
    }
  }

  void _updateDeviceStatus(String serial, bool isRunning) {
    int index = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
    if (index != -1) {
      var device = Map<String, dynamic>.from(devices[index]);
      if (isDeviceRunning(device) != isRunning) {
        device['start_status'] = isRunning;
        device['updatedAt'] = DateTime.now().toIso8601String();
        devices[index] = device;
        devices.refresh();
      }
    }
  }

  @override
  void onReady() {
    super.onReady();
    _initSocket();
    fetchDevices();
    
    // Periodically refresh the UI to update Online/Offline status
    _offlineCheckTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      devices.refresh();
    });
  }

  Future<void> fetchDevices() async {
    isLoading.value = true;

    final url = Uri.parse(AppConfig.baseUrl + AppConfig.userAssignedDevicesEndpoint);
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();

    try {
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "user_id": userId,
        }),
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        if (jsonData['success'] == true && jsonData['data'] != null) {
          final List<dynamic> data = jsonData['data'];
          final updatedDevices = <Map<String, dynamic>>[];
          
          for (var device in data) {
            final mapDevice = Map<String, dynamic>.from(device);
            final serial = mapDevice['serial_number'] ?? mapDevice['serialNumber'];
            
            // Check if we have this device already to preserve real-time status
            final existingIndex = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
            if (existingIndex != -1) {
              final existingDevice = devices[existingIndex];
              final existingUpdate = existingDevice['updatedAt'];
              final newUpdate = mapDevice['updatedAt'];
              
              if (existingUpdate != null) {
                DateTime? existingTime;
                DateTime? newTime;
                
                try { existingTime = DateTime.parse(existingUpdate.toString()); } catch (_) {}
                try { newTime = newUpdate != null ? DateTime.parse(newUpdate.toString()) : null; } catch (_) {}
                
                // If local status is newer or from socket, preserve it
                if (newTime == null || existingTime!.isAfter(newTime)) {
                  mapDevice['updatedAt'] = existingUpdate;
                  mapDevice['start_status'] = existingDevice['start_status'];
                }
              }
            }

            final lat = _parseDouble(mapDevice['latitude']);
            final lng = _parseDouble(mapDevice['longitude']);
            
            if (mapDevice['location'] == null || mapDevice['location'].toString().isEmpty || mapDevice['location'] == 'No Location') {
              if (lat != null && lng != null) {
                final address = await _getAddressFromCoordinates(lat, lng);
                if (address != null) {
                  mapDevice['location'] = address;
                }
              }
            }
            updatedDevices.add(mapDevice);
          }
          
          devices.value = updatedDevices;
          await _storage.write('assigned_devices', devices);
        } else {
          devices.value = [];
          await _storage.write('assigned_devices', []);
        }
      } else if (response.statusCode == 401) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar("Error", "Session expired. Please login again");
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          Get.offAllNamed('/login');
        });
      } else if (response.statusCode == 404) {
        devices.value = [];
      } else {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar("Error", "Failed to fetch devices");
        });
      }
    } catch (e) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Get.snackbar("Error", "Connection failed: $e");
      });
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> toggleDevice(String serialNumber, String imei, bool status) async {
    try {
      final url = Uri.parse(AppConfig.baseUrl + AppConfig.startStopDeviceEndpoint);
      final token = tokenService.getToken();
      final userEmail = tokenService.getUserEmail();

      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "serial_number": serialNumber,
          "imei_number": imei,
          "user_email": userEmail,
          "start_status": status,
        }),
      );

      if (response.statusCode == 200) {
        // Update local state immediately for better UX and sorting
        _updateDeviceStatus(serialNumber, status);
        
        Future.delayed(Duration.zero, () {
          Get.snackbar("Success", "Motor ${status ? 'Started' : 'Stopped'} Successfully");
        });
      } else if (response.statusCode == 401) {
        Get.offAllNamed('/login');
        Future.delayed(Duration.zero, () {
          Get.snackbar("Error", "Session expired. Please login again");
        });
      } else {
        final body = jsonDecode(response.body);
        Future.delayed(Duration.zero, () {
          Get.snackbar("Error", body['message'] ?? "Failed to toggle device");
        });
      }
    } catch (e) {
      Future.delayed(Duration.zero, () {
        Get.snackbar("Error", "Connection failed: $e");
      });
    }
  }

  Future<void> assignDevice(String serialNumber) async {
    print('🔷 ==========================================');
    print('🔷 ASSIGN DEVICE API CALL START');
    print('🔷 ==========================================');
    
    final url = Uri.parse(AppConfig.baseUrl + AppConfig.deviceAssignToUserEndpoint);
    final token = tokenService.getToken();
    final userId = tokenService.getUserId();
    final userName = tokenService.getUserName();
    final userEmail = tokenService.getUserEmail();

    print('📍 URL: $url');
    print('📍 Serial Number: $serialNumber');
    print('📍 User ID: $userId');
    print('📍 User Name: $userName');
    print('📍 User Email: $userEmail');
    print('📍 Token: ${token?.substring(0, 20)}...');

    if (serialNumber.isEmpty) {
      print('❌ Serial number is empty');
      Get.snackbar("Error", "Serial number is required");
      return;
    }

    final requestBody = {
      "serial_number": serialNumber,
      "user_id": userId,
      "assignedBy": userEmail,
    };
    
    print('📤 Request Body: ${jsonEncode(requestBody)}');

    try {
      print('🌐 Making HTTP POST request...');
      
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode(requestBody),
      );

      print('📥 Response Status Code: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      await Future.delayed(const Duration(milliseconds: 300));
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Device assigned successfully');
        final jsonData = jsonDecode(response.body);
        print('🟢 SUCCESS DIALOG OPENED: Device assigned successfully');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Success'),
              content: Text(jsonData['message'] ?? "Device assigned successfully"),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
        await fetchDevices();
      } else if (response.statusCode == 401) {
        print('❌ Unauthorized - Session expired');
        print('🔴 ERROR DIALOG OPENED: Session expired');
        Get.offAllNamed('/login');
      } else if (response.statusCode == 404) {
        print('❌ Device not found');
        print('🔴 ERROR DIALOG OPENED: Device not found');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: const Text('Device not found'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      } else if (response.statusCode == 400) {
        print('❌ Bad request');
        final jsonData = jsonDecode(response.body);
        final errorMsg = jsonData['message'] ?? "Invalid request";
        print('🔴 ERROR DIALOG OPENED: $errorMsg');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: Text(errorMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      } else {
        print('❌ Failed with status: ${response.statusCode}');
        final jsonData = jsonDecode(response.body);
        final errorMsg = jsonData['message'] ?? "Failed to assign device";
        print('🔴 ERROR DIALOG OPENED: $errorMsg');
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Error'),
              content: Text(errorMsg),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
          barrierDismissible: false,
        );
      }
    } catch (e, stackTrace) {
      print('❌ Exception occurred: $e');
      print('❌ Stack trace: $stackTrace');
      print('🔴 ERROR DIALOG OPENED: Connection failed');
      await Future.delayed(const Duration(milliseconds: 300));
      Get.dialog(
        Builder(
          builder: (context) => AlertDialog(
            title: const Text('Error'),
            content: Text('Connection failed: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
        barrierDismissible: false,
      );
    }
    
    print('🔷 ==========================================');
    print('🔷 ASSIGN DEVICE API CALL END');
    print('🔷 ==========================================');
  }

  Future<void> showAddDeviceDialog() async {
    final cameraStatus = await Permission.camera.status;
    
    if (cameraStatus.isDenied) {
      final result = await Permission.camera.request();
      if (result.isDenied) {
        Get.snackbar(
          'Permission Denied',
          'Camera permission is required to scan device QR code',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
          duration: const Duration(seconds: 3),
        );
        return;
      }
    } else if (cameraStatus.isPermanentlyDenied) {
      Get.dialog(
        Builder(
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.camera_alt_outlined,
                    size: 60,
                    color: Colors.orange[400],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Camera Permission Required',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Please enable camera permission in app settings to scan device QR codes',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black54,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            openAppSettings();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green[600],
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Settings'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      return;
    }
    
    final String? result = await Get.to(() => const QRScannerView());
    
    if (result != null && result.isNotEmpty) {
      assignDevice(result);
    }
  }
    
  Future<void> respondToShare(String serial, String action) async {
    isLoading.value = true;
    try {
      final token = tokenService.getToken();
      final userId = tokenService.getUserId();
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/app/respondToDeviceShare'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'serial_number': serial,
          'user_id': userId,
          'action': action,
        }),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        Get.snackbar('Success', 'Sharing request ${action} successfully');
        fetchDevices();
      } else {
        Get.snackbar('Error', data['message'] ?? 'Failed to respond to request');
      }
    } catch (e) {
      Get.snackbar('Error', 'Failed to respond to request');
    } finally {
      isLoading.value = false;
    }
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  Future<String?> _getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        List<String> addressParts = [];
        
        if (place.subLocality != null && place.subLocality!.isNotEmpty) {
          addressParts.add(place.subLocality!);
        }
        if (place.locality != null && place.locality!.isNotEmpty) {
          addressParts.add(place.locality!);
        }
        if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
          addressParts.add(place.administrativeArea!);
        }
        
        return addressParts.isNotEmpty ? addressParts.join(', ') : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  List<Map<String, dynamic>> get displayDevices {
    if (selectedFilter.value == 'Running') {
      return devices.where((d) => isDeviceRunning(d)).toList();
    } else if (selectedFilter.value == 'Stopped') {
      return devices.where((d) => isDeviceConfigured(d) && !isDeviceRunning(d)).toList();
    } else if (selectedFilter.value == 'Online') {
      var filtered = devices.where((d) => isOnline(d)).toList();
      filtered.sort((a, b) {
        bool runningA = isDeviceRunning(a);
        bool runningB = isDeviceRunning(b);
        if (runningA != runningB) return runningA ? -1 : 1;
        return _getUpdatedAt(b).compareTo(_getUpdatedAt(a));
      });
      return filtered;
    } else if (selectedFilter.value == 'Offline') {
      var filtered = devices.where((d) => !isOnline(d)).toList();
      filtered.sort((a, b) {
        bool runningA = isDeviceRunning(a);
        bool runningB = isDeviceRunning(b);
        if (runningA != runningB) return runningA ? -1 : 1;
        return _getUpdatedAt(b).compareTo(_getUpdatedAt(a));
      });
      return filtered;
    } else if (selectedFilter.value == 'Recently') {
      // Sort by isRunning first, then by updatedAt timestamp
      var sorted = List<Map<String, dynamic>>.from(devices);
      sorted.sort((a, b) {
        // Running devices first
        bool runningA = isDeviceRunning(a);
        bool runningB = isDeviceRunning(b);
        if (runningA != runningB) {
          return runningA ? -1 : 1;
        }
        
        // Then by updatedAt
        DateTime timeA = _getUpdatedAt(a);
        DateTime timeB = _getUpdatedAt(b);
        return timeB.compareTo(timeA); // Descending (newest first)
      });
      return sorted.take(5).toList();
    } else {
      // 'All' - return all devices sorted by running status first
      var sorted = List<Map<String, dynamic>>.from(devices);
      sorted.sort((a, b) {
        bool runningA = isDeviceRunning(a);
        bool runningB = isDeviceRunning(b);
        if (runningA != runningB) {
          return runningA ? -1 : 1;
        }
        return _getUpdatedAt(b).compareTo(_getUpdatedAt(a));
      });
      return sorted;
    }
  }

  DateTime _getUpdatedAt(Map<String, dynamic> device) {
    final updated = device['updatedAt'] ?? 
                  device['updated_at'] ?? 
                  device['timestamp'] ?? 
                  device['createdAt'] ?? 
                  device['created_at'];
    if (updated == null) return DateTime(2000);
    if (updated is DateTime) return updated;
    try {
      return DateTime.parse(updated.toString());
    } catch (e) {
      return DateTime(2000);
    }
  }

  bool isDeviceConfigured(Map<String, dynamic> device) {
    final imei = device['imei_number'] ?? device['imeiNumber'];
    if (imei == null) return false;
    return imei.toString().trim().isNotEmpty;
  }

  bool isDeviceRunning(Map<String, dynamic> device) {
    final status = device['start_status'] ?? 
                  device['startStatus'] ?? 
                  device['status'] ?? 
                  device['device_status'] ??
                  device['motor_running'] ??
                  device['motor_status'];
    if (status is bool) {
      return status;
    }
    if (status is num) {
      return status == 1;
    }
    if (status is String) {
      final normalized = status.toLowerCase();
      return normalized == 'running' || 
             normalized == 'on' || 
             normalized == 'true' || 
             normalized == '1' ||
             normalized == 'active';
    }
    return false;
  }

  bool isOnline(Map<String, dynamic> device) {
    // Check real-time connectivity based on last update timestamp (2 minute threshold)
    final lastUpdate = _getUpdatedAt(device);
    final now = DateTime.now();
    final difference = now.difference(lastUpdate).inSeconds;
    
    // Also check static status as a fallback
    final staticStatus = device['device_status']?.toString().toLowerCase() ?? 
                        device['status']?.toString().toLowerCase() ?? '';
    
    return difference < 120 && staticStatus != 'offline';
  }

  String getLastSeenText(Map<String, dynamic> device) {
    final lastUpdate = _getUpdatedAt(device);
    final now = DateTime.now();
    final difference = now.difference(lastUpdate);

    if (difference.inSeconds < 30) {
      return 'Just now';
    } else if (difference.inMinutes < 1) {
      return '${difference.inSeconds}s ago';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}
