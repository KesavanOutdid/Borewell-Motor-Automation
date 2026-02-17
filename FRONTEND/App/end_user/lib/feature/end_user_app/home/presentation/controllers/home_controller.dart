import 'dart:async';
import 'dart:io';
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

class HomeController extends GetxController with WidgetsBindingObserver {
  var devices = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  var isLoadingMore = false.obs;
  var errorMessage = "".obs;
  var selectedFilter = 'Recently'.obs;
  var processingDevices = <String>{}.obs; // Track per-device processing state
  
  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var hasMore = true.obs;
  static const int limit = 10;
  
  final scrollController = ScrollController();

  late TokenService tokenService;
  final _storage = GetStorage();
  IO.Socket? _socket;
  Timer? _offlineCheckTimer;
  Timer? _pendingRefreshTimer;

  // Track pending commands to avoid status mismatch during socket lag
  final _pendingCommands = <String, _PendingCommand>{};
  static const Duration _commandPendingWindow = Duration(seconds: 20);

  void setFilter(String filter) {
    if (selectedFilter.value == filter) return;
    selectedFilter.value = filter;
    currentPage.value = 1;
    hasMore.value = true;
    devices.clear();
    fetchDevices();
  }

  bool? _getMotorRunning(Map<String, dynamic> payload) {
    final motorRunning = payload['motor_running'] ?? 
                         payload['MOTOR_RUNNING'] ?? 
                         payload['start_status'] ??
                         payload['START_STATUS'];

    // 1. If we have an explicit status, use it immediately
    if (motorRunning == true) return true;
    if (motorRunning == false) return false;

    // 2. If status is missing, use RPM as a fallback (Heuristic)
    final rpmValue = payload['motor_rpm'] ?? payload['MOTOR_RPM'];
    if (rpmValue != null) {
      final rpm = _parseDouble(rpmValue) ?? 0;
      return rpm > 10;
    }

    // 3. If neither status nor RPM is in this payload, return null (Keep current UI state)
    return null;
  }

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    tokenService = Get.find<TokenService>();
    _loadCachedDevices();
    
    scrollController.addListener(() {
      if (scrollController.offset >= scrollController.position.maxScrollExtent - 200) {
        fetchMoreDevices();
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      print('🏠 [HOME] App resumed, refreshing device states...');
      _socket?.connect(); // Ensure socket is connected
      fetchDevices(silent: true);
    }
  }

  void _loadCachedDevices() {
    try {
      final cached = _storage.read('assigned_devices');
      if (cached != null) {
        final List<Map<String, dynamic>> list = List<Map<String, dynamic>>.from(
          (cached as List).map((i) => Map<String, dynamic>.from(i))
        );
        if (list.isNotEmpty) {
          print('🏠 [HOME] Loaded ${list.length} devices from cache');
          devices.assignAll(list);
        }
      }
    } catch (e) {
      print('🏠 [HOME] Error loading cached devices: $e');
    }
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    scrollController.dispose();
    _socket?.dispose();
    _offlineCheckTimer?.cancel();
    super.onClose();
  }

  void _initSocket() {
    print('🏠 [HOME] Initializing Socket.IO connection...');
    try {
      final token = tokenService.getToken();
      _socket = IO.io(AppConfig.socketIOUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'forceNew': true,
        'query': {'token': token}
      });

      _socket!.onConnect((_) => print('🏠 [HOME] Socket Connected successfully'));
      _socket!.onDisconnect((_) => print('🏠 [HOME] Socket Disconnected'));
      _socket!.onConnectError((err) => print('🏠 [HOME] Socket Connection Error: $err'));

      _socket!.on('LIVE_STATUS', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          final payload = data['payload'];
          _updateDeviceLastSeen(serial, silent: true);
          if (payload != null) {
            print('🏠 [HOME] Socket LIVE_STATUS received for $serial');
            final newStatus = _getMotorRunning(Map<String, dynamic>.from(payload));
            
            if (newStatus == null) return; // Ignore payloads without status info

            // Respect pending command window
            if (_pendingCommands.containsKey(serial)) {
              final pending = _pendingCommands[serial]!;
              if (DateTime.now().difference(pending.time) < _commandPendingWindow) {
                if (newStatus != pending.status) {
                  print('🏠 [HOME] Ignoring contradictory status for $serial (command pending)');
                  return;
                } else {
                  // Confirmed! Clear pending
                  _pendingCommands.remove(serial);
                }
              } else {
                // Window expired
                _pendingCommands.remove(serial);
              }
            }

            _updateDeviceStatus(serial, newStatus);
          }
        }
      });

      _socket!.on('LIVE_TELEMETRY', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          _updateDeviceLastSeen(serial, silent: true);
        }
      });

      _socket!.on('LIVE_HEARTBEAT', (data) {
        if (data != null && data['serial_number'] != null) {
          final serial = data['serial_number'];
          _updateDeviceLastSeen(serial, silent: true);
          
          final Map<String, dynamic> payload = data is Map ? Map<String, dynamic>.from(data) : {};
          final newStatus = _getMotorRunning(payload);
          
          if (newStatus == null) return; // Ignore payloads without status info

          // Respect pending command window
          if (_pendingCommands.containsKey(serial)) {
            final pending = _pendingCommands[serial]!;
            if (DateTime.now().difference(pending.time) < _commandPendingWindow) {
              if (newStatus != pending.status) {
                print('🏠 [HOME] Ignoring contradictory heartbeat status for $serial (command pending)');
                return;
              }
            }
          }
          _updateDeviceStatus(serial, newStatus);
        }
      });
    } catch (e) {
      print('🏠 [HOME] Socket initialization Error: $e');
    }
  }

  void _updateDeviceLastSeen(String serial, {bool silent = false}) {
    int index = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
    if (index != -1) {
      var device = Map<String, dynamic>.from(devices[index]);
      device['last_heartbeat'] = DateTime.now().toIso8601String();
      devices[index] = device;
      if (!silent) {
        devices.refresh();
      }
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

  void markCommandPending(String serial, bool status) {
    _pendingCommands[serial] = _PendingCommand(status, DateTime.now());
  }

  @override
  void onReady() {
    super.onReady();
    _initSocket();
    fetchDevices();
    
    // Periodically refresh the UI to update Online/Offline status (last seen text)
    _offlineCheckTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      // Just refresh the obs without re-fetching or re-assigning
      devices.refresh();
    });
  }

  Future<void> fetchDevices({bool silent = false, bool loadMore = false}) async {
    if (loadMore) {
      if (isLoadingMore.value || !hasMore.value) return;
      isLoadingMore.value = true;
    } else {
      if (!silent) {
        isLoading.value = true;
        errorMessage.value = "";
      }
      currentPage.value = 1;
    }

    print('🏠 [HOME] Fetching devices - Filter: ${selectedFilter.value}, Page: ${currentPage.value}');
    
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
          "page": currentPage.value,
          "limit": limit,
          "filter": selectedFilter.value,
        }),
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        if (jsonData['success'] == true && jsonData['data'] != null) {
          final List<dynamic> data = jsonData['data'];
          totalPages.value = jsonData['totalPages'] ?? 1;
          
          final List<Map<String, dynamic>> processedData = [];
          for (var device in data) {
            final mapDevice = Map<String, dynamic>.from(device);
            final serial = mapDevice['serial_number'] ?? mapDevice['serialNumber'];

            if (mapDevice['telemetry'] is Map) {
              mapDevice.addAll(Map<String, dynamic>.from(mapDevice['telemetry']));
            }
            
            mapDevice['start_status'] = _getMotorRunning(mapDevice);
            
            final existingIndex = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
            if (existingIndex != -1) {
              final existingDevice = devices[existingIndex];
              if (existingDevice['last_heartbeat'] != null) {
                mapDevice['last_heartbeat'] = existingDevice['last_heartbeat'];
              }
              
              if (_pendingCommands.containsKey(serial)) {
                final pending = _pendingCommands[serial]!;
                if (DateTime.now().difference(pending.time) < _commandPendingWindow) {
                  mapDevice['start_status'] = pending.status;
                }
              }
            }

            final lat = _parseDouble(mapDevice['latitude']);
            final lng = _parseDouble(mapDevice['longitude']);
            if (mapDevice['location'] == null || mapDevice['location'].toString().isEmpty || mapDevice['location'] == 'No Location') {
              if (lat != null && lng != null) {
                _updateLocationAsync(serial, lat, lng);
              }
            }
            processedData.add(mapDevice);
          }

          if (loadMore) {
            devices.addAll(processedData);
          } else {
            devices.assignAll(processedData);
            if (!silent) {
              await _storage.write('assigned_devices', devices);
            }
          }

          hasMore.value = currentPage.value < totalPages.value;
          if (hasMore.value) {
            currentPage.value++;
          }
        }
      } else if (response.statusCode == 401) {
        Get.offAllNamed('/login');
      } else {
        if (!silent && !loadMore) errorMessage.value = "Failed to fetch devices";
      }
    } catch (e) {
      print('🏠 [HOME] Error fetching devices: $e');
      if (!silent && !loadMore) errorMessage.value = "Connection failed";
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }

  Future<void> fetchMoreDevices() async {
    await fetchDevices(loadMore: true);
  }

  Future<void> _updateLocationAsync(String serial, double lat, double lng) async {
    try {
      final address = await _getAddressFromCoordinates(lat, lng);
      if (address != null) {
        int index = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serial);
        if (index != -1) {
          var device = Map<String, dynamic>.from(devices[index]);
          device['location'] = address;
          devices[index] = device;
          devices.refresh();
        }
      }
    } catch (e) {
      print('🏠 [HOME] Async location update failed: $e');
    }
  }

  Future<void> toggleDevice(String serialNumber, String imei, bool status) async {
    if (processingDevices.contains(serialNumber)) return;
    
    print('🏠 [HOME] Toggle device request: $serialNumber, Action: ${status ? 'START' : 'STOP'}');
    
    // Check current status before sending command
    final deviceIndex = devices.indexWhere((d) => (d['serial_number'] ?? d['serialNumber']) == serialNumber);
    if (deviceIndex != -1) {
      final device = devices[deviceIndex];
      final currentRunning = isDeviceRunning(device);
      if (currentRunning == status) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (Get.overlayContext != null) {
            Get.snackbar(
              "Info", 
              "Motor is already ${status ? 'running' : 'stopped'}",
              snackPosition: SnackPosition.BOTTOM,
              duration: const Duration(seconds: 2),
            );
          }
        });
        return;
      }
    }

    processingDevices.add(serialNumber);
    try {
      final url = Uri.parse(AppConfig.baseUrl + AppConfig.startStopDeviceEndpoint);
      final token = tokenService.getToken();
      final userEmail = tokenService.getUserEmail();

      print('🏠 [HOME] API Request: POST $url');
      print('🏠 [HOME] Body: {serial: $serialNumber, status: $status, email: $userEmail}');

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

      print('🏠 [HOME] API Response: Status ${response.statusCode}');
      print('🏠 [HOME] Response Body: ${response.body}');

      if (response.statusCode == 200) {
        // Mark as pending locally to handle socket lag
        markCommandPending(serialNumber, status);
        
        // Update local state immediately for better UX and sorting
        _updateDeviceStatus(serialNumber, status);
        
        // Use WidgetsBinding to ensure the overlay is available
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (Get.overlayContext != null) {
            Get.snackbar(
              "Success", 
              "Motor ${status ? 'Started' : 'Stopped'} Successfully",
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.green.withOpacity(0.8),
              colorText: Colors.white,
            );
          }
        });
      } else if (response.statusCode == 429) {
        final body = jsonDecode(response.body);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (Get.overlayContext != null) {
            Get.snackbar("Error", body['message'] ?? "Please wait a moment");
          }
        });
      } else if (response.statusCode == 401) {
        Get.offAllNamed('/login');
        Future.delayed(Duration.zero, () {
          if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
            Get.snackbar("Error", "Session expired. Please login again");
          }
        });
      } else {
        final body = jsonDecode(response.body);
        Future.delayed(Duration.zero, () {
          if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
            Get.snackbar("Error", body['message'] ?? "Failed to toggle device");
          }
        });
      }
    } catch (e) {
      Future.delayed(Duration.zero, () {
        if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
          Get.snackbar("Error", "Connection failed: $e");
        }
      });
    } finally {
      // Small delay to prevent rapid fire
      await Future.delayed(const Duration(milliseconds: 500));
      processingDevices.remove(serialNumber);
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

  DateTime _getLastHeartbeat(Map<String, dynamic> device) {
    final heartbeat = device['last_heartbeat'];
    if (heartbeat == null) return _getUpdatedAt(device); 
    if (heartbeat is DateTime) return heartbeat;
    try {
      return DateTime.parse(heartbeat.toString());
    } catch (e) {
      return _getUpdatedAt(device);
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
    // Check real-time connectivity based on last heartbeat (2 minute threshold)
    final heartbeat = device['last_heartbeat'];
    if (heartbeat == null) return false;
    
    DateTime lastUpdate;
    if (heartbeat is DateTime) {
      lastUpdate = heartbeat;
    } else {
      try {
        lastUpdate = DateTime.parse(heartbeat.toString());
      } catch (e) {
        return false;
      }
    }
    
    final now = DateTime.now();
    // Use UTC for comparison if the server sends UTC, but here we assume local time alignment
    final difference = now.difference(lastUpdate).inSeconds;
    
    return difference >= 0 && difference < 120;
  }

  String getLastSeenText(Map<String, dynamic> device) {
    final lastUpdate = _getLastHeartbeat(device);
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

class _PendingCommand {
  final bool status;
  final DateTime time;
  _PendingCommand(this.status, this.time);
}
