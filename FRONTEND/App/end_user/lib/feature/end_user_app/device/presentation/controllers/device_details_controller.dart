import 'dart:async';
import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:geocoding/geocoding.dart';

import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../core/services/notification_service.dart';

class DeviceDetailsController extends GetxController {
  final liveData = <String, dynamic>{}.obs;
  final isConnected = false.obs;
  final isLoading = false.obs;

  late TokenService tokenService;
  final NotificationService _notificationService = NotificationService();

  String? serialNumber;
  String? imeiNumber;
  bool _initialized = false;

  IO.Socket? _socket;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  String? _socketSerial;
  bool? _previousMotorRunning;
  static const Duration _istOffset = Duration(hours: 5, minutes: 30);
  static const Duration _heartbeatGrace = Duration(seconds: 20);

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  @override
  void onClose() {
    _closeSocket();
    if (serialNumber != null) {
      _notificationService.cancelNotification(serialNumber!);
    }
    super.onClose();
  }

  void initialize(Map<String, dynamic> args) async {
    final previousSerial = serialNumber;
    final previousImei = imeiNumber;

    serialNumber = args['serial_number'] ?? args['serialNumber'] ?? serialNumber;
    imeiNumber = args['imei_number'] ?? args['imeiNumber'] ?? imeiNumber;

    final deviceChanged = previousSerial != serialNumber || previousImei != imeiNumber;

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

    liveData.assignAll({
      'serialNumber': serialNumber ?? '-',
      'imei': imeiNumber ?? '-',
      'role': args['role'] ?? 'master',
      'motorHp': args['motor_hp']?.toString() ?? args['motorHp']?.toString() ?? '-',
      'location': locationText ?? _formatCoordinate(latitude, longitude),
      'latitude': latitude ?? 28.6139,
      'longitude': longitude ?? 77.2090,
      'motorStatus': deviceChanged ? '-' : (liveData['motorStatus'] ?? '-'),
      'deviceStatus': deviceChanged ? 'Offline' : (liveData['deviceStatus'] ?? 'Offline'),
      'lastStart': deviceChanged ? '-' : (liveData['lastStart'] ?? '-'),
      'lastStop': deviceChanged ? '-' : (liveData['lastStop'] ?? '-'),
      'lastUpdate': deviceChanged ? '-' : (liveData['lastUpdate'] ?? '-'),
      'motorFrequency': deviceChanged ? '-' : (liveData['motorFrequency'] ?? '-'),
      'motorEnergy': deviceChanged ? '-' : (liveData['motorEnergy'] ?? '-'),
      'alert': deviceChanged ? '-' : (liveData['alert'] ?? '-'),
      'deviceTemperature': deviceChanged ? '-' : (liveData['deviceTemperature'] ?? '-'),
      'motorPower': deviceChanged ? '-' : (liveData['motorPower'] ?? '-'),
      'flowRate': deviceChanged ? '-' : (liveData['flowRate'] ?? '-'),
      'motorSpeed': deviceChanged ? '-' : (liveData['motorSpeed'] ?? '-'),
      'signalStrength': deviceChanged ? '-' : (liveData['signalStrength'] ?? '-'),
    });

    _ensureSocketConnection();

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

  Future<void> fetchDeviceDetails() async {
    if (serialNumber == null || imeiNumber == null) {
      _showMessage('Missing device information');
      return;
    }

    final token = tokenService.getToken();
    if (token == null) {
      _handleUnauthorized();
      return;
    }

    isLoading.value = true;

    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.userDeviceDetailsEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'imei_number': imeiNumber,
        }),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true && json['data'] != null) {
          _applyDeviceData(Map<String, dynamic>.from(json['data']));
        } else {
          _showMessage(json['message'] ?? 'Unable to load device details');
        }
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else {
        final json = jsonDecode(response.body);
        _showMessage(json['message'] ?? 'Failed to load device (${response.statusCode})');
      }
    } catch (e) {
      _showMessage('Connection failed: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> refreshData() async {
    await fetchDeviceDetails();
  }

  Future<void> startMotor() async {
    await _sendStartStopCommand(true);
  }

  Future<void> stopMotor() async {
    await _sendStartStopCommand(false);
  }

  Future<void> updateNickname(String newNickname) async {
    if (serialNumber == null) {
      _showMessage('Missing device information');
      return;
    }

    final token = tokenService.getToken();
    final userEmail = tokenService.getUserEmail();
    if (token == null || userEmail == null) {
      _handleUnauthorized();
      return;
    }

    isLoading.value = true;
    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.updateDeviceNicknameEndpoint),
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

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true) {
          liveData['nickname'] = newNickname;
          liveData.refresh();
          _showMessage('Nickname updated successfully');
        } else {
          _showMessage(json['message'] ?? 'Failed to update nickname');
        }
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
    if (serialNumber == null || imeiNumber == null) {
      _showMessage('Missing device information');
      return;
    }

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

    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.startStopDeviceEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'serial_number': serialNumber,
          'imei_number': imeiNumber,
          'user_email': userEmail,
          'start_status': start,
        }),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final message = body['message']?.toString() ?? 'Device updated';
        _showMessage(message);
        
        liveData['motorStatus'] = start ? 'Running' : 'Stopped';
        liveData['deviceStatus'] = start ? 'Running' : 'Ready';
        liveData.refresh();
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else if (response.statusCode == 404) {
        _showMessage('Device not found');
      } else {
        _showMessage('Command failed (${response.statusCode})');
      }
    } catch (e) {
      _showMessage('Command failed: $e');
    }
  }

  void _ensureSocketConnection() {
    final serial = serialNumber;
    if (serial == null || serial.trim().isEmpty) {
      _closeSocket();
      return;
    }

    if (_socketSerial != serial || _socket == null || !_socket!.connected) {
      _socketSerial = serial;
      _connectSocket();
    }
  }

  void _connectSocket() {
    final serial = serialNumber;
    if (serial == null || serial.trim().isEmpty) {
      return;
    }

    _reconnectTimer?.cancel();
    _disconnectSocket();

    try {
      final token = tokenService.getToken();
      
      _socket = IO.io(AppConfig.socketIOUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
        'query': {
          'token': token,
          'serial_number': serial,
        }
      });

      _socket!.on('connect', (_) {
        isConnected.value = true;
      });

      _socket!.on('disconnect', (_) {
        isConnected.value = false;
        _scheduleReconnect();
      });

      _socket!.on('LIVE_STATUS', (data) => _handleLiveStatus(data));
      _socket!.on('LIVE_TELEMETRY', (data) => _handleLiveTelemetry(data));
      _socket!.on('LIVE_ALERT', (data) => _handleLiveAlert(data));
      _socket!.on('LIVE_HEARTBEAT', (data) => _handleLiveHeartbeat(data));
      _socket!.on('LIVE_BOOT', (data) => _handleLiveBoot(data));

      _socket!.connect();
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _disconnectSocket() {
    _socket?.dispose();
    _socket = null;
  }

  void _closeSocket() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _disconnectSocket();
    _resetHeartbeatState();
    _socketSerial = null;
  }

  void _scheduleReconnect() {
    _disconnectSocket();
    _resetHeartbeatState();
    _reconnectTimer?.cancel();
    if (serialNumber == null || serialNumber!.trim().isEmpty) {
      return;
    }
    _reconnectTimer = Timer(const Duration(seconds: 5), _connectSocket);
  }

  void _handleLiveStatus(dynamic data) {
    if (serialNumber == null || serialNumber!.trim().isEmpty) return;
    
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyStatusPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveTelemetry(dynamic data) {
    if (serialNumber == null || serialNumber!.trim().isEmpty) return;
    
    if (data is Map) {
      final telemetry = data['telemetry'];
      if (telemetry is Map) {
        _applyTelemetryPayload(Map<String, dynamic>.from(telemetry));
      }
    }
  }

  void _handleLiveAlert(dynamic data) {
    if (serialNumber == null || serialNumber!.trim().isEmpty) return;
    
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyAlertPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveHeartbeat(dynamic data) {
    if (serialNumber == null || serialNumber!.trim().isEmpty) return;
    
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyHeartbeatPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _handleLiveBoot(dynamic data) {
    if (serialNumber == null || serialNumber!.trim().isEmpty) return;
    
    if (data is Map) {
      final payload = data['payload'];
      if (payload is Map) {
        _applyBootPayload(Map<String, dynamic>.from(payload));
      }
    }
  }

  void _applyStatusPayload(Map<String, dynamic> payload) {
    final running = payload['motor_running'] == true;
    final timestamp = _formatDate(payload['timestamp']) ?? liveData['lastUpdate'];
    liveData['motorStatus'] = running ? 'Running' : 'Stopped';
    liveData['deviceStatus'] = running ? 'Running' : 'Ready';
    if (timestamp != null) {
      liveData['lastUpdate'] = timestamp;
    }
    if (payload['signal_strength'] != null) {
      liveData['signalStrength'] = _formatMetric(payload['signal_strength']);
    }
    if (running && (_previousMotorRunning == false || _previousMotorRunning == null)) {
      final startTime = _formatDate(payload['timestamp']) ?? _formattedNow();
      liveData['lastStart'] = startTime;
      if (serialNumber != null) {
        _notificationService.showMotorRunningNotification(
          serialNumber: serialNumber!,
          startTime: startTime,
        );
      }
    }
    if (!running && _previousMotorRunning == true) {
      final stopTime = _formatDate(payload['timestamp']) ?? _formattedNow();
      liveData['lastStop'] = stopTime;
      if (serialNumber != null) {
        _notificationService.showMotorStoppedNotification(
          serialNumber: serialNumber!,
          stopTime: stopTime,
        );
      }
    }
    _previousMotorRunning = running;
    liveData.refresh();
  }

  void _applyTelemetryPayload(Map<String, dynamic> telemetry) {
    if (telemetry['motor_frequency_hz'] != null) {
      liveData['motorFrequency'] = _formatMetric(telemetry['motor_frequency_hz'], suffix: ' Hz');
    }
    if (telemetry['energy_kwh'] != null) {
      liveData['motorEnergy'] = _formatMetric(telemetry['energy_kwh'], suffix: ' kWh');
    }
    if (telemetry['device_temp_c'] != null) {
      liveData['deviceTemperature'] = _formatMetric(telemetry['device_temp_c'], suffix: '°C');
    }
    if (telemetry['power_kw'] != null) {
      liveData['motorPower'] = _formatMetric(telemetry['power_kw'], suffix: ' kW');
    }
    if (telemetry['flow_lpm'] != null) {
      liveData['flowRate'] = _formatMetric(telemetry['flow_lpm'], suffix: ' LPM');
    }
    if (telemetry['motor_rpm'] != null) {
      liveData['motorSpeed'] = _formatMetric(telemetry['motor_rpm'], suffix: ' RPM');
    }
    if (telemetry['signal_strength'] != null) {
      liveData['signalStrength'] = _formatMetric(telemetry['signal_strength']);
    }
    if (telemetry['fault_code'] != null) {
      final faultCode = _formatMetric(telemetry['fault_code']);
      if (faultCode != '-' && faultCode.isNotEmpty) {
        liveData['alert'] = faultCode;
        
        if (serialNumber != null && faultCode != '0') {
          final timestamp = _formatDate(telemetry['timestamp']);
          _notificationService.showAlertNotification(
            serialNumber: serialNumber!,
            alertMessage: 'Fault Code: $faultCode',
            timestamp: timestamp,
            deviceStatus: 'Warning',
          );
        }
      }
    }
    final updated = _formatDate(telemetry['timestamp']);
    if (updated != null) {
      liveData['lastUpdate'] = updated;
    }
    liveData.refresh();
  }

  void _applyAlertPayload(Map<String, dynamic> payload) {
    final alertMessage = _extractAlertMessage(payload);
    if (alertMessage != '-' && alertMessage.isNotEmpty) {
      liveData['alert'] = alertMessage;
    }
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null) {
      liveData['lastUpdate'] = timestamp;
    }
    
    if (serialNumber != null && alertMessage != '-' && alertMessage.isNotEmpty) {
      final alertType = payload['alert_type']?.toString() ?? '';
      final deviceStatus = payload['device_status']?.toString() ?? '';
      final description = payload['description']?.toString() ?? '';
      
      String fullAlertMessage = alertMessage;
      if (alertType.isNotEmpty) {
        fullAlertMessage = 'Type: $alertType';
      }
      if (deviceStatus.isNotEmpty) {
        fullAlertMessage += '\nStatus: $deviceStatus';
      }
      if (description.isNotEmpty) {
        fullAlertMessage += '\n$description';
      }
      
      _notificationService.showAlertNotification(
        serialNumber: serialNumber!,
        alertMessage: fullAlertMessage,
        timestamp: timestamp,
        deviceStatus: deviceStatus,
      );
    }
    
    liveData.refresh();
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
    _markHeartbeatReceived();
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null) {
      liveData['lastUpdate'] = timestamp;
    }
    if (payload['device_status'] != null) {
      liveData['deviceStatus'] = payload['device_status'].toString();
    }
    liveData.refresh();
  }

  void _applyBootPayload(Map<String, dynamic> payload) {
    final timestamp = _formatDate(payload['timestamp']);
    if (timestamp != null) {
      liveData['lastUpdate'] = timestamp;
    }
    liveData['deviceStatus'] = 'Booting';
    liveData.refresh();
  }

  void _markHeartbeatReceived() {
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

    final isRunning = data['start_status'] == true;
    final wasRunning = _previousMotorRunning == true;

    final alertValue = _formatMetric(data['alert'] ?? telemetry['alert']);
    final persistAlert = (alertValue == '-' || alertValue.isEmpty) 
        ? (liveData['alert'] ?? '-') 
        : alertValue;

    liveData.assignAll({
      'serialNumber': data['serial_number'] ?? serialNumber ?? '-',
      'imei': data['imei_number'] ?? imeiNumber ?? '-',
      'role': data['role'] ?? liveData['role'] ?? 'master',
      'motorHp': data['motor_hp']?.toString() ?? liveData['motorHp'] ?? '-',
      'location': locationText ?? liveData['location'] ?? '-',
      'latitude': latitude ?? 28.6139,
      'longitude': longitude ?? 77.2090,
      'motorStatus': isRunning ? 'Running' : 'Stopped',
      'deviceStatus': isRunning ? 'Running' : 'Ready',
      'lastStart': _formatDate(data['startAt']) ?? liveData['lastStart'] ?? '-',
      'lastStop': _formatDate(data['stopAt']) ?? liveData['lastStop'] ?? '-',
      'lastUpdate': _formatDate(data['updatedAt'] ?? data['timestamp']) ?? liveData['lastUpdate'] ?? '-',
      'motorFrequency': _formatMetric(telemetry['motor_frequency_hz'], suffix: ' Hz'),
      'motorEnergy': _formatMetric(telemetry['energy_kwh'], suffix: ' kWh'),
      'alert': persistAlert,
      'deviceTemperature': _formatMetric(telemetry['device_temp_c'], suffix: '°C'),
      'motorPower': _formatMetric(telemetry['power_kw'], suffix: ' kW'),
      'flowRate': _formatMetric(telemetry['flow_lpm'], suffix: ' LPM'),
      'motorSpeed': _formatMetric(telemetry['motor_rpm'], suffix: ' RPM'),
      'signalStrength': _formatMetric(telemetry['signal_strength']),
    });

    if (isRunning && !wasRunning && serialNumber != null) {
      _notificationService.showMotorRunningNotification(
        serialNumber: serialNumber!,
        startTime: liveData['lastStart'] as String?,
      );
    } else if (!isRunning && wasRunning && serialNumber != null) {
      _notificationService.showMotorStoppedNotification(
        serialNumber: serialNumber!,
        stopTime: liveData['lastStop'] as String?,
      );
    }

    _previousMotorRunning = isRunning;
  }

  String _formatMetric(dynamic value, {String suffix = ''}) {
    if (value == null) return '-';
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
    if (latitude == null || longitude == null) return '-';
    return 'Lat: ${latitude.toStringAsFixed(4)}, Long: ${longitude.toStringAsFixed(4)}';
  }

  String? _formatDate(dynamic value) {
    if (value == null) return null;
    try {
      final dateTime = value is DateTime ? value : DateTime.parse(value.toString());
      final istTime = _convertToIst(dateTime);
      final twoDigits = (int v) => v.toString().padLeft(2, '0');
      final hour = istTime.hour == 0 ? 12 : (istTime.hour > 12 ? istTime.hour - 12 : istTime.hour);
      final period = istTime.hour >= 12 ? 'PM' : 'AM';
      return '${twoDigits(istTime.day)}/${twoDigits(istTime.month)}/${istTime.year} ${twoDigits(hour)}:${twoDigits(istTime.minute)} $period IST';
    } catch (_) {
      return value.toString();
    }
  }

  String _formattedNow() {
    final now = _convertToIst(DateTime.now());
    final twoDigits = (int v) => v.toString().padLeft(2, '0');
    final hour = now.hour == 0 ? 12 : (now.hour > 12 ? now.hour - 12 : now.hour);
    final period = now.hour >= 12 ? 'PM' : 'AM';
    return '${twoDigits(now.day)}/${twoDigits(now.month)}/${now.year} ${twoDigits(hour)}:${twoDigits(now.minute)} $period IST';
  }

  DateTime _convertToIst(DateTime dateTime) {
    final utcTime = dateTime.isUtc ? dateTime : dateTime.toUtc();
    return utcTime.add(_istOffset);
  }

  void _showMessage(String message) {
    Get.snackbar('Device', message, snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
  }

  void _handleUnauthorized() {
    Get.offAllNamed('/login');
    Get.snackbar('Session expired', 'Please login again', snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
  }
}
