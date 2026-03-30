import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import '../../../../../core/config/app_constants.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import 'package:http/http.dart' as http;
import '../../../../../core/services/socket_service.dart';
import 'package:geocoding/geocoding.dart';

import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../utils/ui_utils.dart';
// import '../../../../../core/services/notification_service.dart';

class DeviceDetailsController extends GetxController with WidgetsBindingObserver {
  final liveData = <String, dynamic>{}.obs;
  final isConnected = false.obs;
  final isLoading = false.obs;
  final isProcessing = false.obs;
  final errorMessage = "".obs;
  final _storage = GetStorage();

  late TokenService tokenService;
  // removed NotificationService as per user request to use only FCM

  String? serialNumber;
  String? imeiNumber;
  bool _initialized = false;

  List<StreamSubscription> _socketSubs = [];
  Timer? _heartbeatTimer;
  bool? _previousMotorRunning;
  bool? _pendingCommandStatus;
  Timer? _commandTimeoutTimer;
  DateTime? _lastCommandTime;
  bool? _lastCommandStatus;

  bool get running => liveData['motorStatus'] == 'Running';

  bool get isPoorSignal {
    final sig = liveData['signalStrength']?.toString() ?? '0';
    // Remove non-numeric characters (like %)
    final cleanSig = sig.replaceAll(RegExp(r'[^0-9.]'), '');
    final value = double.tryParse(cleanSig) ?? 0;
    return value > 0 && value < 30; // Assuming 0-100 percentage as per ICD
  }

  static const Duration _istOffset = Duration(hours: 5, minutes: 30);
  static const Duration _heartbeatGrace = Duration(seconds: 180);
  static const Duration _commandPendingWindow = Duration(seconds: 20);
  static const Duration _commandConfirmTimeout = Duration(seconds: 15);

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    tokenService = Get.find<TokenService>();
    
    // Initialize with arguments if available
    final args = Get.arguments;
    if (args is Map<String, dynamic>) {
      initialize(args);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      print('🔧 [DETAILS] App resumed, refreshing state for $serialNumber');
      Get.find<SocketService>().ensureConnected();
      refreshData();
    }
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    for (var sub in _socketSubs) sub.cancel();
    _socketSubs.clear();
    _heartbeatTimer?.cancel();
    _commandTimeoutTimer?.cancel();
    super.onClose();
  }

  void initialize(Map<String, dynamic> args) async {
    print('🔧 [DETAILS] Initializing DeviceDetails for args: $args');
    final previousSerial = serialNumber;
    final previousImei = imeiNumber;

    serialNumber = args['serial_number'] ?? args['serialNumber'] ?? serialNumber;
    imeiNumber = args['imei_number'] ?? args['imeiNumber'] ?? imeiNumber;

    print('🔧 [DETAILS] Serial: $serialNumber, IMEI: $imeiNumber');

    final deviceChanged = previousSerial != serialNumber || previousImei != imeiNumber;
    
    // Check initial connection status from args
    final lastSeenStr = args['updatedAt'] ?? args['lastUpdate'] ?? args['timestamp'] ?? args['last_heartbeat'];
    if (lastSeenStr != null) {
      try {
        final lastSeen = DateTime.parse(lastSeenStr.toString()).toUtc();
        final now = DateTime.now().toUtc();
        if (now.difference(lastSeen).inSeconds < 180) {
          isConnected.value = true;
          _startHeartbeatTimer();
        }
      } catch (_) {}
    }

    if (!_initialized || deviceChanged) {
      _resetHeartbeatState();
    }

    final latitude = _parseDouble(args['latitude']);
    final longitude = _parseDouble(args['longitude']);
    
    String? locationText = args['location'];
    if ((locationText == null || locationText.isEmpty || locationText == '-') && 
        latitude != null && longitude != null) {
      locationText = await _getAddressFromCoordinates(latitude, longitude);
    }

    final isRunningInitial = _getMotorRunning(args);

    liveData.assignAll({
      'serialNumber': serialNumber ?? '-',
      'nickname': args['device_nickname'] ?? args['nickname'] ?? (deviceChanged ? '-' : (liveData['nickname'] ?? '-')),
      'imei': imeiNumber ?? '-',
      'role': args['role'] ?? 'master',
      'motorHp': args['motor_hp']?.toString() ?? args['motorHp']?.toString() ?? '-',
      'location': locationText ?? _formatCoordinate(latitude, longitude),
      'latitude': latitude ?? 0.0,
      'longitude': longitude ?? 0.0,
      'motorStatus': isRunningInitial ? 'Running' : 'Stopped',
      'deviceStatus': isRunningInitial ? 'Running' : (isConnected.value ? 'Ready' : 'Offline'),
      'lastStart': args['startAt'] ?? (deviceChanged ? '-' : (liveData['lastStart'] ?? '-')),
      'lastStop': args['stopAt'] ?? (deviceChanged ? '-' : (liveData['lastStop'] ?? '-')),
      'lastUpdate': lastSeenStr ?? (deviceChanged ? '-' : (liveData['lastUpdate'] ?? '-')),
      'motorFrequency': _formatMetric(args['motor_frequency_hz'], suffix: ' Hz') ?? (deviceChanged ? '-' : (liveData['motorFrequency'] ?? '-')),
      'motorEnergy': _formatMetric(args['energy_kwh'], suffix: ' kWh') ?? (deviceChanged ? '-' : (liveData['motorEnergy'] ?? '-')),
      'alert': _formatMetric(args['alert']) ?? (deviceChanged ? '-' : (liveData['alert'] ?? '-')),
      'deviceTemperature': _formatMetric(args['device_temp_c'], suffix: '°C') ?? (deviceChanged ? '-' : (liveData['deviceTemperature'] ?? '-')),
      'motorPower': _formatMetric(args['power_kw'], suffix: ' kW') ?? (deviceChanged ? '-' : (liveData['motorPower'] ?? '-')),
      'flowRate': _formatMetric(args['flow_lpm'], suffix: ' LPM') ?? (deviceChanged ? '-' : (liveData['flowRate'] ?? '-')),
      'motorSpeed': _formatMetric(args['motor_rpm'], suffix: ' RPM') ?? (deviceChanged ? '-' : (liveData['motorSpeed'] ?? '-')),
      'signalStrength': _formatMetric(args['signal_strength']) ?? (deviceChanged ? '-' : (liveData['signalStrength'] ?? '-')),
    });

    _subscribeToSocket();
    
    // Load from cache if we have a serial number
    // We always load from cache to ensure background FCM updates are applied
    // over potentially stale data from the Home Page API
    if (serialNumber != null) {
      _loadFromCache(force: true);
    }

    if (!_initialized || deviceChanged) {
      _initialized = true;
    }
    
    fetchDeviceDetails();
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

  Future<void> fetchDeviceDetails({bool silent = false}) async {
    print('🔧 [DETAILS] Fetching latest device details for $serialNumber');
    if (serialNumber == null) {
      _showMessage('Missing device information');
      return;
    }

    final token = tokenService.getToken();
    if (token == null) {
      _handleUnauthorized();
      return;
    }

    if (!silent) {
      isLoading.value = true;
      errorMessage.value = "";
    }
    final url = Uri.parse(AppConfig.baseUrl + AppConfig.userDeviceDetailsEndpoint);
    print('🔧 [DETAILS] API Request: POST $url');

    try {
      final body = {
        'serial_number': serialNumber,
      };
      if (imeiNumber != null && imeiNumber!.isNotEmpty && imeiNumber != '-') {
        body['imei_number'] = imeiNumber!;
      }

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );

      print('🔧 [DETAILS] API Response: Status ${response.statusCode}');

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        print('🔧 [DETAILS] Data received successfully');
        if (json['success'] == true && json['data'] != null) {
          _applyDeviceData(Map<String, dynamic>.from(json['data']));
        } else {
          _showMessage(json['message'] ?? 'Unable to load device details');
        }
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      } else {
        final json = jsonDecode(response.body);
        _showMessage(json['message'] ?? 'Failed to load device (${response.statusCode})');
      }
    } catch (e) {
      if (!silent) {
        if (e is SocketException || e.toString().contains('SocketException')) {
          errorMessage.value = "Network connection failed. Please check your internet.";
        } else {
          errorMessage.value = "Connection failed: $e";
        }
      }
    } finally {
      if (!silent) isLoading.value = false;
    }
  }

  Future<void> refreshData() async {
    await fetchDeviceDetails(silent: true);
  }

  Future<void> startMotor() async {
    if (liveData['motorStatus'] == 'Running') {
      _showMessage('Motor is already running');
      return;
    }
    await _sendStartStopCommand(true);
  }

  Future<void> stopMotor() async {
    if (liveData['motorStatus'] == 'Stopped') {
      _showMessage('Motor is already stopped');
      return;
    }
    await _sendStartStopCommand(false);
  }

  Future<void> updateNickname(String newNickname) async {
    print('DEBUG: updateNickname called with: $newNickname');
    if (serialNumber == null) {
      print('DEBUG: serialNumber is null');
      _showMessage('Missing device information');
      return;
    }

    final token = tokenService.getToken();
    final userEmail = tokenService.getUserEmail();
    print('DEBUG: userEmail: $userEmail');
    if (token == null || userEmail == null) {
      print('DEBUG: token or userEmail is null');
      _handleUnauthorized();
      return;
    }

    isLoading.value = true;
    try {
      final url = AppConfig.baseUrl + AppConfig.updateDeviceNicknameEndpoint;
      print('DEBUG: calling POST $url');
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'device_nickname': newNickname,
          'user_email': userEmail,
        }),
      );

      print('DEBUG: response status: ${response.statusCode}');
      print('DEBUG: response body: ${response.body}');

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true) {
          liveData['nickname'] = newNickname;
          liveData.refresh();
          
          // Sync with HomeController
          try {
            Get.find<HomeController>().fetchDevices();
          } catch (e) {
            print('DEBUG: Could not refresh HomeController: $e');
          }
          
          _showMessage('Nickname updated successfully');
        } else {
          _showMessage(json['message'] ?? 'Failed to update nickname');
        }
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      } else {
        _showMessage('Update failed (${response.statusCode})');
      }
    } catch (e) {
      _showMessage('Connection failed: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _sendStartStopCommand(bool start) async {
    if (isProcessing.value) return;

    final startTime = DateTime.now();
    print('⏱️ [LATENCY] 1. App sending command: ${start ? 'START' : 'STOP'} at ${startTime.toIso8601String()}');
    
    if (serialNumber == null) {
      _showMessage('Missing device information');
      return;
    }

    isProcessing.value = true;
    _lastCommandTime = DateTime.now();
    _lastCommandStatus = start;
    _pendingCommandStatus = start;

    try {
      final token = tokenService.getToken();
      if (token == null) {
        _handleUnauthorized();
        return;
      }

      final userEmail = tokenService.getUserEmail();
      if (userEmail == null || userEmail.isEmpty) {
        _showMessage('User email not available');
        return;
      }

      final url = Uri.parse(AppConfig.baseUrl + AppConfig.startStopDeviceEndpoint);
      
      final body = {
        'serial_number': serialNumber,
        'user_email': userEmail,
        'start_status': start,
      };
      if (imeiNumber != null && imeiNumber!.isNotEmpty && imeiNumber != '-') {
        body['imei_number'] = imeiNumber!;
      }

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(body),
      );

      final endTime = DateTime.now();
      print('⏱️ [LATENCY] 2. HTTP Response received in ${endTime.difference(startTime).inMilliseconds}ms (Status: ${response.statusCode})');

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final message = body['message']?.toString() ?? 'Command sent to device';
        _showMessage(message);
        
        // Clear cache if motor is stopped
        if (!start) {
          clearDeviceCache();
        }
        
        // Start timeout timer for confirmation
        _commandTimeoutTimer?.cancel();
        _commandTimeoutTimer = Timer(_commandConfirmTimeout, () {
          if (isProcessing.value && _pendingCommandStatus != null) {
            print('⏱️ [LATENCY] ❌ Command confirmation TIMED OUT after ${_commandConfirmTimeout.inSeconds}s');
            isProcessing.value = false;
            _pendingCommandStatus = null;
            _showMessage('Command sent, waiting for device confirmation...');
            fetchDeviceDetails(silent: true);
          }
        });

        // Sync with HomeController
        try {
          final homeController = Get.find<HomeController>();
          homeController.fetchDevices(silent: true);
        } catch (e) {
          print('🔧 [DETAILS] Could not sync with HomeController: $e');
        }
      } else if (response.statusCode == 429) {
        // Handle Redis rate limiting/locking
        final body = jsonDecode(response.body);
        _showMessage(body['message'] ?? 'Please wait a moment before sending another command');
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      } else if (response.statusCode == 404) {
        _showMessage('Device not found');
      } else {
        _showMessage('Command failed (${response.statusCode})');
        isProcessing.value = false;
        _pendingCommandStatus = null;
      }
    } catch (e) {
      _showMessage('Command failed: $e');
      isProcessing.value = false;
      _pendingCommandStatus = null;
    } finally {
      // Small delay before allowing next command to prevent UI rapid fire
      await Future.delayed(const Duration(milliseconds: 500));
      // Only reset isProcessing if we didn't start a pending confirmation
      if (_pendingCommandStatus == null) {
        isProcessing.value = false;
      }
    }
  }

  void _subscribeToSocket() {
    final serial = serialNumber;
    if (serial == null || serial.trim().isEmpty) {
      return;
    }

    // Cancel previous subscriptions
    for (var sub in _socketSubs) sub.cancel();
    _socketSubs.clear();

    print('🔌 [DETAILS SOCKET] Subscribing to events for $serial...');

    try {
      final socketService = Get.find<SocketService>();

      _socketSubs.add(socketService.statusFor(serial).listen((data) {
        print('🔌 [DETAILS SOCKET] LIVE_STATUS: $data');
        _handleLiveStatus(data);
      }));

      _socketSubs.add(socketService.telemetryFor(serial).listen((data) {
        print('🔌 [DETAILS SOCKET] LIVE_TELEMETRY: $data');
        _handleLiveTelemetry(data);
      }));

      _socketSubs.add(socketService.alertFor(serial).listen((data) {
        print('🔌 [DETAILS SOCKET] LIVE_ALERT: $data');
        _handleLiveAlert(data);
      }));

      _socketSubs.add(socketService.heartbeatFor(serial).listen((data) {
        print('🔌 [DETAILS SOCKET] LIVE_HEARTBEAT: $data');
        _handleLiveHeartbeat(data);
      }));

      _socketSubs.add(socketService.bootFor(serial).listen((data) {
        print('🔌 [DETAILS SOCKET] LIVE_BOOT: $data');
        _handleLiveBoot(data);
      }));
    } catch (e) {
      print('🔌 [DETAILS SOCKET] Subscription Error: $e');
    }
  }

  void _handleLiveStatus(dynamic data) {
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyStatusPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveTelemetry(dynamic data) {
    if (data is Map) {
      final telemetry = data['telemetry'];
      if (telemetry is Map) {
        _applyTelemetryPayload(Map<String, dynamic>.from(telemetry));
      }
    }
  }

  void _handleLiveAlert(dynamic data) {
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyAlertPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveHeartbeat(dynamic data) {
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyHeartbeatPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveBoot(dynamic data) {
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyBootPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  bool _getMotorRunning(Map<String, dynamic> payload) {
    // 1. Trust explicit status flags first if they exist
    final motorRunning = payload['motor_running'] ?? 
                         payload['MOTOR_RUNNING'] ?? 
                         payload['start_status'] ??
                         payload['START_STATUS'] ??
                         payload['motor_status'] ??
                         payload['motorStatus'] ??
                         payload['status'];
    
    if (motorRunning != null) {
      final normalized = motorRunning.toString().toLowerCase();
      return motorRunning == true || 
             normalized == 'true' || 
             normalized == 'running' || 
             normalized == 'on' || 
             normalized == '1';
    }

    // 2. RPM Heuristic: Use only as a fallback if explicit status is missing
    final rpmValue = payload['motor_rpm'] ?? payload['MOTOR_RPM'];
    if (rpmValue != null) {
      final rpm = _parseDouble(rpmValue) ?? 0;
      if (rpm > 10) {
        print('🔧 [DETAILS] Motor inferred RUNNING solely via RPM: $rpm (No status flag present)');
        return true;
      }
    }

    return false;
  }

  void _applyStatusPayload(Map<String, dynamic> payload) {
    _startHeartbeatTimer();
    
    final running = _getMotorRunning(payload);
    
    // Check for command confirmation
    if (isProcessing.value && _pendingCommandStatus != null) {
      bool confirmed = false;
      
      // Explicit check for acknowledged command if available in status
      final ackCmd = payload['acknowledged_command']?.toString();
      if (ackCmd != null) {
        if (_pendingCommandStatus == true && ackCmd == 'START_MOTOR') confirmed = true;
        if (_pendingCommandStatus == false && ackCmd == 'STOP_MOTOR') confirmed = true;
      }
      
      // Fallback to state check
      if (!confirmed && running == _pendingCommandStatus) {
        confirmed = true;
      }

      if (confirmed) {
        final confirmedTime = DateTime.now();
        final diff = _lastCommandTime != null ? confirmedTime.difference(_lastCommandTime!).inMilliseconds : -1;
        print('⏱️ [LATENCY] 4. Socket Confirmation received! Time from command: ${diff}ms (via STATUS)');
        _commandTimeoutTimer?.cancel();
        _pendingCommandStatus = null;
        isProcessing.value = false;
      } else {
        print('🔧 [DETAILS] Status update received: ${running ? 'RUNNING' : 'STOPPED'} (Still waiting for ${_pendingCommandStatus == true ? 'START' : 'STOP'})');
        return; // Ignore updates that don't match our pending command
      }
    }
    
    // Ignore updates that contradict a recent command (last window)
    if (_lastCommandTime != null && _lastCommandStatus != null) {
      if (DateTime.now().difference(_lastCommandTime!) < _commandPendingWindow) {
        if (running != _lastCommandStatus) {
          print('🔧 [DETAILS] Ignoring contradictory status update (command pending)');
          return;
        }
      }
    }

    bool changed = false;
    final timestamp = _formatDate(payload['timestamp']) ?? liveData['lastUpdate'];
    
    final newMotorStatus = running ? 'Running' : 'Stopped';
    if (liveData['motorStatus'] != newMotorStatus) {
      liveData['motorStatus'] = newMotorStatus;
      changed = true;
    }

    final newDeviceStatus = running ? 'Running' : 'Ready';
    if (liveData['deviceStatus'] != newDeviceStatus) {
      liveData['deviceStatus'] = newDeviceStatus;
      changed = true;
    }

    if (timestamp != null && liveData['lastUpdate'] != timestamp) {
      liveData['lastUpdate'] = timestamp;
      changed = true;
    }

    if (payload['signal_strength'] != null) {
      final newSignal = _formatMetric(payload['signal_strength']);
      if (newSignal != null && liveData['signalStrength'] != newSignal) {
        liveData['signalStrength'] = newSignal;
        changed = true;
      }
    }

    if (running && (_previousMotorRunning == false || _previousMotorRunning == null)) {
      final startTime = _formatDate(payload['timestamp']) ?? _formattedNow();
      if (liveData['lastStart'] != startTime) {
        liveData['lastStart'] = startTime;
        changed = true;
      }
    }
    if (!running && _previousMotorRunning == true) {
      final stopTime = _formatDate(payload['timestamp']) ?? _formattedNow();
      if (liveData['lastStop'] != stopTime) {
        liveData['lastStop'] = stopTime;
        changed = true;
      }
    }
    
    _previousMotorRunning = running;
    
    if (changed) {
      liveData.refresh();
      if (!running) {
        clearDeviceCache();
      } else {
        _saveToCache();
      }
    }
  }

  void _applyTelemetryPayload(Map<String, dynamic> telemetry) {
    _startHeartbeatTimer();
    
    bool changed = false;

    // Support motor_running in telemetry as requested by user
    final running = _getMotorRunning(telemetry);
    
    // Check for command confirmation
    if (isProcessing.value && _pendingCommandStatus != null) {
      if (running == _pendingCommandStatus) {
        print('🔧 [DETAILS] Command confirmed via TELEMETRY message');
        _commandTimeoutTimer?.cancel();
        _pendingCommandStatus = null;
        isProcessing.value = false;
      } else {
        print('🔧 [DETAILS] Telemetry received while processing, but not confirming pending command');
        return; // Ignore updates that don't match our pending command
      }
    }
    
    // Ignore updates that contradict a recent command (last window)
    bool shouldUpdateStatus = true;
    if (_lastCommandTime != null && _lastCommandStatus != null) {
      if (DateTime.now().difference(_lastCommandTime!) < _commandPendingWindow) {
        if (running != _lastCommandStatus) {
          print('🔧 [DETAILS] Ignoring contradictory telemetry status (command pending)');
          shouldUpdateStatus = false;
        }
      }
    }

    if (shouldUpdateStatus) {
      final newMotorStatus = running ? 'Running' : 'Stopped';
      if (liveData['motorStatus'] != newMotorStatus) {
        liveData['motorStatus'] = newMotorStatus;
        changed = true;
      }

      final newDeviceStatus = running ? 'Running' : 'Ready';
      if (liveData['deviceStatus'] != newDeviceStatus) {
        liveData['deviceStatus'] = newDeviceStatus;
        changed = true;
      }
      
      if (running && (_previousMotorRunning == false || _previousMotorRunning == null)) {
        final startTime = _formatDate(telemetry['timestamp']) ?? _formattedNow();
        if (liveData['lastStart'] != startTime) {
          liveData['lastStart'] = startTime;
          changed = true;
        }
      }
      if (!running && _previousMotorRunning == true) {
        final stopTime = _formatDate(telemetry['timestamp']) ?? _formattedNow();
        if (liveData['lastStop'] != stopTime) {
          liveData['lastStop'] = stopTime;
          changed = true;
        }
      }
      _previousMotorRunning = running;
    }

    void updateIfChanged(String key, dynamic newValue) {
      if (newValue != null && liveData[key] != newValue) {
        liveData[key] = newValue;
        changed = true;
      }
    }

    updateIfChanged('motorFrequency', _formatMetric(telemetry['motor_frequency_hz'], suffix: ' Hz'));
    updateIfChanged('motorEnergy', _formatMetric(telemetry['energy_kwh'], suffix: ' kWh'));
    updateIfChanged('deviceTemperature', _formatMetric(telemetry['device_temp_c'], suffix: '°C'));
    updateIfChanged('motorPower', _formatMetric(telemetry['power_kw'], suffix: ' kW'));
    updateIfChanged('flowRate', _formatMetric(telemetry['flow_lpm'], suffix: ' LPM'));
    updateIfChanged('motorSpeed', _formatMetric(telemetry['motor_rpm'], suffix: ' RPM'));
    updateIfChanged('signalStrength', _formatMetric(telemetry['signal_strength']));

    if (telemetry['fault_code'] != null) {
      final faultCode = _formatMetric(telemetry['fault_code']);
      if (faultCode != null && faultCode != '-' && faultCode.isNotEmpty && liveData['alert'] != faultCode) {
        liveData['alert'] = faultCode;
        changed = true;
      }
    }

    final updated = _formatDate(telemetry['timestamp']);
    if (updated != null && liveData['lastUpdate'] != updated) {
      liveData['lastUpdate'] = updated;
      changed = true;
    }

    if (changed) {
      liveData.refresh();
      // Only clear cache on the transition from running → stopped
      if (!running && (_previousMotorRunning == true)) {
        clearDeviceCache();
      } else if (running) {
        _saveToCache();
      }
    }
  }

  void _applyAlertPayload(Map<String, dynamic> payload) {
    if (isProcessing.value) return;
    _startHeartbeatTimer();
    
    bool changed = false;
    
    // Only update motor status if the alert payload explicitly carries it
    final hasStatusField = payload.containsKey('motor_running') ||
        payload.containsKey('MOTOR_RUNNING') ||
        payload.containsKey('start_status') ||
        payload.containsKey('START_STATUS') ||
        payload.containsKey('motor_status') ||
        payload.containsKey('motorStatus');

    if (hasStatusField) {
      final runningFromPayload = _getMotorRunning(payload);
      final newMotorStatus = runningFromPayload ? 'Running' : 'Stopped';
      if (liveData['motorStatus'] != newMotorStatus) {
        liveData['motorStatus'] = newMotorStatus;
        changed = true;
      }
      final newDeviceStatus = runningFromPayload ? 'Running' : 'Ready';
      if (liveData['deviceStatus'] != newDeviceStatus) {
        liveData['deviceStatus'] = newDeviceStatus;
        changed = true;
      }
      _previousMotorRunning = runningFromPayload;
    }

    final alertMessage = _extractAlertMessage(payload);
    if (alertMessage != '-' && alertMessage.isNotEmpty && liveData['alert'] != alertMessage) {
      liveData['alert'] = alertMessage;
      changed = true;
    }
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null && liveData['lastUpdate'] != timestamp) {
      liveData['lastUpdate'] = timestamp;
      changed = true;
    }
    
    if (changed) {
      liveData.refresh();
      // Only clear cache on the transition from running → stopped
      if (!running && (_previousMotorRunning == true)) {
        clearDeviceCache();
      } else if (running) {
        _saveToCache();
      }
    }
  }

  String _extractAlertMessage(Map<String, dynamic> payload) {
    final keys = ['alert_message', 'alert', 'message', 'fault_code', 'alert_type', 'code', 'status'];
    for (final key in keys) {
      final value = payload[key];
      if (value != null) {
        final text = value.toString().trim();
        if (text.isNotEmpty) {
          return text;
        }
      }
    }
    if (payload.isEmpty) {
      return '-';
    }
    return jsonEncode(payload);
  }

  void _applyHeartbeatPayload(Map<String, dynamic> payload) {
    _startHeartbeatTimer();
    
    bool changed = false;
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null && liveData['lastUpdate'] != timestamp) {
      liveData['lastUpdate'] = timestamp;
      changed = true;
    }

    // Update motor status from heartbeat if present
    final running = _getMotorRunning(payload);
    
    // Check for command confirmation
    if (isProcessing.value && _pendingCommandStatus != null) {
      if (running == _pendingCommandStatus) {
        print('🔧 [DETAILS] Command confirmed via HEARTBEAT message');
        _commandTimeoutTimer?.cancel();
        _pendingCommandStatus = null;
        isProcessing.value = false;
      } else {
        print('🔧 [DETAILS] Heartbeat received while processing, but not confirming pending command');
        return; // Ignore updates that don't match our pending command
      }
    }
    
    // Ignore updates that contradict a recent command (last window)
    bool shouldUpdateStatus = true;
    if (_lastCommandTime != null && _lastCommandStatus != null) {
      if (DateTime.now().difference(_lastCommandTime!) < _commandPendingWindow) {
        if (running != _lastCommandStatus) {
          print('🔧 [DETAILS] Ignoring contradictory heartbeat status (command pending)');
          shouldUpdateStatus = false;
        }
      }
    }

    if (shouldUpdateStatus) {
      final newMotorStatus = running ? 'Running' : 'Stopped';
      if (liveData['motorStatus'] != newMotorStatus) {
        liveData['motorStatus'] = newMotorStatus;
        changed = true;
      }

      final newDeviceStatus = running ? 'Running' : 'Ready';
      if (liveData['deviceStatus'] != newDeviceStatus) {
        liveData['deviceStatus'] = newDeviceStatus;
        changed = true;
      }
    } else if (payload['device_status'] != null) {
      final newStatus = payload['device_status'].toString();
      if (liveData['deviceStatus'] != newStatus) {
        liveData['deviceStatus'] = newStatus;
        changed = true;
      }
    }

    if (changed) {
      liveData.refresh();
      // Only clear cache on the transition from running → stopped
      if (!running && (_previousMotorRunning == true)) {
        clearDeviceCache();
      } else if (running) {
        _saveToCache();
      }
    }
  }

  void _applyBootPayload(Map<String, dynamic> payload) {
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null) {
      liveData['lastUpdate'] = timestamp;
    }
    liveData['deviceStatus'] = 'Booting';
    liveData.refresh();
  }

  void _startHeartbeatTimer() {
    if (!isConnected.value) {
      isConnected.value = true;
    }
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer(_heartbeatGrace, () {
      isConnected.value = false;
    });
  }

  void _resetHeartbeatState() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    if (isConnected.value) {
      isConnected.value = false;
    }
  }

  void _applyDeviceData(Map<String, dynamic> data) async {
    final telemetry = data['telemetry'] is Map
        ? Map<String, dynamic>.from(data['telemetry'])
        : <String, dynamic>{};

    final latitude = _parseDouble(data['latitude']) ?? liveData['latitude'] as double?;
    final longitude = _parseDouble(data['longitude']) ?? liveData['longitude'] as double?;

    String? locationText = data['location']?.toString();
    if ((locationText == null || locationText.isEmpty || locationText == '-') && 
        latitude != null && longitude != null) {
      final address = await _getAddressFromCoordinates(latitude, longitude);
      if (address != null) locationText = address;
    }

    // Merge telemetry into data for _getMotorRunning to check RPM if available
    final combinedData = Map<String, dynamic>.from(data);
    if (data['telemetry'] is Map) {
      combinedData.addAll(Map<String, dynamic>.from(data['telemetry']));
    }
    
    // Merge with local cache to preserve FCM updates received while app was backgrounded/closed
    if (serialNumber != null) {
      final cache = _storage.read('device_details_cache');
      if (cache != null && cache[serialNumber!] != null) {
        final cachedData = Map<String, dynamic>.from(cache[serialNumber!]);
        // Priority: Use cached data if it's more recent or the API data is missing fields
        cachedData.forEach((key, value) {
          if (value != null && value != '-') {
            // Logic to prefer cache: if API field is missing or default
            if (combinedData[key] == null || combinedData[key] == '-' || combinedData[key] == '') {
              combinedData[key] = value;
            }
          }
        });
      }
    }

    final isRunning = _getMotorRunning(combinedData);

    // Ignore status updates that contradict a recent command (last window) OR while processing
    bool shouldUpdateStatus = true;
    if (isProcessing.value) {
      print('🔧 [DETAILS] Ignoring API status update while processing command');
      shouldUpdateStatus = false;
    } else if (_lastCommandTime != null && _lastCommandStatus != null) {
      if (DateTime.now().difference(_lastCommandTime!) < _commandPendingWindow) {
        if (isRunning != _lastCommandStatus) {
          print('🔧 [DETAILS] Ignoring contradictory API status (command pending)');
          shouldUpdateStatus = false;
        }
      }
    }

    final alertValue = _formatMetric(data['alert'] ?? telemetry['alert']);
    final persistAlert = (alertValue == null || alertValue == '-' || alertValue.isEmpty) 
        ? (liveData['alert'] ?? '-') 
        : alertValue;

    final newLiveData = {
      'serialNumber': data['serial_number'] ?? serialNumber ?? '-',
      'nickname': data['device_nickname'] ?? liveData['nickname'] ?? '-',
      'imei': data['imei_number'] ?? imeiNumber ?? '-',
      'role': data['role'] ?? liveData['role'] ?? 'master',
      'motorHp': data['motor_hp']?.toString() ?? liveData['motorHp'] ?? '-',
      'location': locationText ?? liveData['location'] ?? '-',
      'latitude': latitude ?? 0.0,
      'longitude': longitude ?? 0.0,
      'motorStatus': shouldUpdateStatus ? (isRunning ? 'Running' : 'Stopped') : liveData['motorStatus'],
      'deviceStatus': shouldUpdateStatus ? (isRunning ? 'Running' : 'Ready') : liveData['deviceStatus'],
      'lastStart': _formatDate(data['startAt']) ?? liveData['lastStart'] ?? '-',
      'lastStop': _formatDate(data['stopAt']) ?? liveData['lastStop'] ?? '-',
      'lastUpdate': _formatDate(combinedData['lastUpdate'] ?? data['updatedAt'] ?? data['timestamp']) ?? liveData['lastUpdate'] ?? '-',
      'motorFrequency': _formatMetric(combinedData['motor_frequency_hz'] ?? combinedData['motorFrequency'], suffix: ' Hz') ?? liveData['motorFrequency'] ?? '-',
      'motorEnergy': _formatMetric(combinedData['energy_kwh'] ?? combinedData['motorEnergy'], suffix: ' kWh') ?? liveData['motorEnergy'] ?? '-',
      'alert': persistAlert,
      'deviceTemperature': _formatMetric(combinedData['device_temp_c'] ?? combinedData['deviceTemperature'], suffix: '°C') ?? liveData['deviceTemperature'] ?? '-',
      'motorPower': _formatMetric(combinedData['power_kw'] ?? combinedData['motorPower'], suffix: ' kW') ?? liveData['motorPower'] ?? '-',
      'flowRate': _formatMetric(combinedData['flow_lpm'] ?? combinedData['flowRate'], suffix: ' LPM') ?? liveData['flowRate'] ?? '-',
      'motorSpeed': _formatMetric(combinedData['motor_rpm'] ?? combinedData['motorSpeed'], suffix: ' RPM') ?? liveData['motorSpeed'] ?? '-',
      'signalStrength': _formatMetric(combinedData['signal_strength'] ?? combinedData['signalStrength']) ?? liveData['signalStrength'] ?? '-',
    };

    bool dataChanged = false;
    newLiveData.forEach((key, value) {
      if (liveData[key] != value) {
        liveData[key] = value;
        dataChanged = true;
      }
    });

    if (dataChanged) {
      liveData.refresh();
      // Only clear cache on the transition from running → stopped
      if (!isRunning && (_previousMotorRunning == true)) {
        clearDeviceCache();
      } else if (isRunning) {
        _saveToCache();
      }
    }

    if (shouldUpdateStatus) {
      _previousMotorRunning = isRunning;
    }

    // Check if online based on last update
    // Priority: 1. Socket connection, 2. Recent command, 3. Timestamp threshold
    bool isActuallyConnected = isConnected.value;

    if (Get.find<SocketService>().isConnected.value) {
      isActuallyConnected = true;
    } else {
      final lastUpdate = data['last_heartbeat'] ?? data['updatedAt'] ?? data['timestamp'];
      if (lastUpdate != null) {
        try {
          final dateTime = DateTime.parse(lastUpdate.toString()).toUtc();
          final now = DateTime.now().toUtc();
          final diff = now.difference(dateTime).inSeconds;
          
          // Use 180s (3m) threshold for API-based online status to allow for some clock drift
          if (diff < 180) {
            isActuallyConnected = true;
          } else if (_lastCommandTime != null && DateTime.now().difference(_lastCommandTime!).inSeconds < 60) {
            // Stay online if we just successfully sent a command to the server
            isActuallyConnected = true;
          } else {
            isActuallyConnected = false;
          }
        } catch (_) {
          // Keep current state on parse error if not already offline
        }
      }
    }

    if (isActuallyConnected) {
      _startHeartbeatTimer();
    } else {
      isConnected.value = false;
    }
  }

  String? _formatMetric(dynamic value, {String suffix = ''}) {
    if (value == null) return null;
    final str = _formatNumericValue(value);
    return suffix.isEmpty ? str : '$str$suffix';
  }

  String _formatNumericValue(dynamic value) {
    if (value is num) {
      return _stripTrailingZeros(value.toStringAsFixed(3));
    }
    final parsed = double.tryParse(value.toString());
    if (parsed != null) {
      return _stripTrailingZeros(parsed.toStringAsFixed(3));
    }
    return value.toString();
  }

  String _stripTrailingZeros(String value) {
    if (!value.contains('.')) return value;
    var trimmed = value.replaceAll(RegExp(r'0+$'), '');
    if (trimmed.endsWith('.')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed.isEmpty ? '0' : trimmed;
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  String _formatCoordinate(double? latitude, double? longitude) {
    if (latitude == null || longitude == null || (latitude == 0.0 && longitude == 0.0)) return '-';
    return 'Lat: ${latitude.toStringAsFixed(4)}   Long: ${longitude.toStringAsFixed(4)}';
  }

  String? _formatDate(dynamic value) {
    if (value == null) return null;
    try {
      final dateTime = value is DateTime ? value : DateTime.parse(value.toString());
      final istTime = _convertToIst(dateTime);
      String twoDigits(int v) => v.toString().padLeft(2, '0');
      final hour = istTime.hour == 0 ? 12 : (istTime.hour > 12 ? istTime.hour - 12 : istTime.hour);
      final period = istTime.hour >= 12 ? 'PM' : 'AM';
      return '${twoDigits(istTime.day)}/${twoDigits(istTime.month)}/${istTime.year} ${twoDigits(hour)}:${twoDigits(istTime.minute)} $period IST';
    } catch (_) {
      return value.toString();
    }
  }

  String _formattedNow() {
    final now = _convertToIst(DateTime.now());
    String twoDigits(int v) => v.toString().padLeft(2, '0');
    final hour = now.hour == 0 ? 12 : (now.hour > 12 ? now.hour - 12 : now.hour);
    final period = now.hour >= 12 ? 'PM' : 'AM';
    return '${twoDigits(now.day)}/${twoDigits(now.month)}/${now.year} ${twoDigits(hour)}:${twoDigits(now.minute)} $period IST';
  }

  DateTime _convertToIst(DateTime dateTime) {
    final utcTime = dateTime.isUtc ? dateTime : dateTime.toUtc();
    return utcTime.add(_istOffset);
  }

  void _showMessage(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Get.overlayContext != null) {
        Get.snackbar('Device', message, snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
      } else {
        print('🔧 [DETAILS] Message: $message');
      }
    });
  }

  void _handleUnauthorized() {
    Get.offAllNamed('/login');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Get.overlayContext != null) {
        Get.snackbar('Session expired', 'Please login again', snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
      }
    });
  }

  void _handleDeactivated() {
    UIUtils.handleAccountDeactivated();
  }

  void _saveToCache() {
    if (serialNumber == null) return;
    try {
      final cache = _storage.read('device_details_cache') ?? {};
      final Map<String, dynamic> deviceCache = Map<String, dynamic>.from(cache);
      
      // Save all telemetry and status fields
      deviceCache[serialNumber!] = {
        'motorFrequency': liveData['motorFrequency'],
        'motorEnergy': liveData['motorEnergy'],
        'alert': liveData['alert'],
        'deviceTemperature': liveData['deviceTemperature'],
        'motorPower': liveData['motorPower'],
        'flowRate': liveData['flowRate'],
        'motorSpeed': liveData['motorSpeed'],
        'signalStrength': liveData['signalStrength'],
        'lastUpdate': liveData['lastUpdate'],
        'motorStatus': liveData['motorStatus'],
        'deviceStatus': liveData['deviceStatus'],
        'lastStart': liveData['lastStart'],
        'lastStop': liveData['lastStop'],
        'location': liveData['location'],
        'latitude': liveData['latitude'],
        'longitude': liveData['longitude'],
        'nickname': liveData['nickname'],
        'timestamp': DateTime.now().toIso8601String(),
      };
      
      _storage.write('device_details_cache', deviceCache);
      print('💾 [DETAILS] Saved $serialNumber to persistent cache');
    } catch (e) {
      print('💾 [DETAILS] Cache save error: $e');
    }
  }

  void _loadFromCache({bool force = false}) {
    if (serialNumber == null) return;
    try {
      final cache = _storage.read('device_details_cache');
      if (cache != null && cache[serialNumber!] != null) {
        final data = Map<String, dynamic>.from(cache[serialNumber!]);
        print('💾 [DETAILS] Loading $serialNumber from persistent cache (force: $force)');
        
        final Map<String, String> mappedData = {
          'motorFrequency': _formatMetric(data['motor_frequency_hz'], suffix: ' Hz') ?? data['motorFrequency'] ?? '',
          'motorEnergy': _formatMetric(data['energy_kwh'], suffix: ' kWh') ?? data['motorEnergy'] ?? '',
          'deviceTemperature': _formatMetric(data['device_temp_c'], suffix: '°C') ?? data['deviceTemperature'] ?? '',
          'motorPower': _formatMetric(data['power_kw'], suffix: ' kW') ?? data['motorPower'] ?? '',
          'flowRate': _formatMetric(data['flow_lpm'], suffix: ' LPM') ?? data['flowRate'] ?? '',
          'motorSpeed': _formatMetric(data['motor_rpm'], suffix: ' RPM') ?? data['motorSpeed'] ?? '',
          'signalStrength': _formatMetric(data['signal_strength']) ?? data['signalStrength'] ?? '',
          'alert': _formatMetric(data['alert']) ?? data['alert'] ?? '',
          'motorStatus': data['motorStatus'] ?? '',
          'deviceStatus': data['deviceStatus'] ?? '',
          'lastUpdate': _formatDate(data['lastUpdate']) ?? data['lastUpdate'] ?? '',
        };

        mappedData.forEach((key, value) {
          if (value.isNotEmpty) {
            bool shouldApply = force || liveData[key] == null || liveData[key] == '-' || liveData[key] == '';
            
            if (key == 'motorStatus' || key == 'deviceStatus') {
              if (!force && liveData[key] == 'Running') {
                shouldApply = false;
              }
            }

            if (shouldApply) {
              liveData[key] = value;
            }
          }
        });
        liveData.refresh();
      }
    } catch (e) {
      print('💾 [DETAILS] Cache load error: $e');
    }
  }

  void clearDeviceCache() {
    if (serialNumber == null) return;
    try {
      // Clear persistent cache
      final cache = _storage.read('device_details_cache') ?? {};
      final Map<String, dynamic> deviceCache = Map<String, dynamic>.from(cache);
      if (deviceCache.containsKey(serialNumber)) {
        deviceCache.remove(serialNumber);
        _storage.write('device_details_cache', deviceCache);
        print('💾 [DETAILS] Cleared $serialNumber from persistent cache (Motor Stopped)');
      }
      
      // Also clear current liveData telemetry fields if stopped
      bool reset = false;
      for (final field in AppConstants.telemetryFields) {
        if (liveData[field] != '-') {
          liveData[field] = '-';
          reset = true;
        }
      }
      
      // Update status as well for instant feedback
      if (liveData['motorStatus'] != 'Stopped') {
        liveData['motorStatus'] = 'Stopped';
        reset = true;
      }
      
      final newDeviceStatus = isConnected.value ? 'Ready' : 'Offline';
      if (liveData['deviceStatus'] != newDeviceStatus) {
        liveData['deviceStatus'] = newDeviceStatus;
        reset = true;
      }
      
      _previousMotorRunning = false;
      
      if (reset) {
        liveData.refresh();
      }
    } catch (e) {
      print('💾 [DETAILS] Cache clear error: $e');
    }
  }
}
