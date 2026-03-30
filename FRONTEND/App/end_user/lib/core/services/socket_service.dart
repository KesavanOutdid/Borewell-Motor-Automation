import 'dart:async';
import 'package:get/get.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/env.dart';
import 'token_service.dart';

/// Centralized Socket.IO service — single connection, multiple listeners.
///
/// Instead of each controller creating its own Socket.IO connection,
/// this service maintains ONE persistent connection and broadcasts
/// events via Dart Streams. Controllers subscribe to the streams
/// they care about (optionally filtered by serial number).
///
/// NOTE: BackgroundNotificationService still has its own socket because
/// it runs in a separate Dart isolate and can't share memory with the
/// main app — that's a Flutter limitation. Since FCM already handles
/// background notifications, consider removing the background service
/// sockets entirely as a follow-up optimization.
class SocketService extends GetxService {
  IO.Socket? _socket;
  Timer? _reconnectTimer;

  final isConnected = false.obs;

  // Broadcast stream controllers — multiple listeners supported
  final _statusController = StreamController<Map<String, dynamic>>.broadcast();
  final _telemetryController = StreamController<Map<String, dynamic>>.broadcast();
  final _heartbeatController = StreamController<Map<String, dynamic>>.broadcast();
  final _alertController = StreamController<Map<String, dynamic>>.broadcast();
  final _bootController = StreamController<Map<String, dynamic>>.broadcast();

  /// Raw event streams — all devices, all events
  Stream<Map<String, dynamic>> get onStatus => _statusController.stream;
  Stream<Map<String, dynamic>> get onTelemetry => _telemetryController.stream;
  Stream<Map<String, dynamic>> get onHeartbeat => _heartbeatController.stream;
  Stream<Map<String, dynamic>> get onAlert => _alertController.stream;
  Stream<Map<String, dynamic>> get onBoot => _bootController.stream;

  /// Filtered streams — only events for a specific device serial number
  Stream<Map<String, dynamic>> statusFor(String serial) =>
      onStatus.where((d) => d['serial_number'] == serial);
  Stream<Map<String, dynamic>> telemetryFor(String serial) =>
      onTelemetry.where((d) => d['serial_number'] == serial);
  Stream<Map<String, dynamic>> heartbeatFor(String serial) =>
      onHeartbeat.where((d) => d['serial_number'] == serial);
  Stream<Map<String, dynamic>> alertFor(String serial) =>
      onAlert.where((d) => d['serial_number'] == serial);
  Stream<Map<String, dynamic>> bootFor(String serial) =>
      onBoot.where((d) => d['serial_number'] == serial);

  /// Connect (or reconnect) the single socket.
  /// Call this after login when a valid token is available.
  void connect() {
    if (_socket?.connected == true) {
      print('🔌 [SOCKET] Already connected, skipping');
      return;
    }

    final token = Get.find<TokenService>().getToken();
    if (token == null || token.isEmpty) {
      print('🔌 [SOCKET] No token available, skipping connection');
      return;
    }

    _disconnect();

    print('🔌 [SOCKET] Connecting to ${AppConfig.socketIOUrl}...');

    _socket = IO.io(AppConfig.socketIOUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'forceNew': true,
      'query': {'token': token},
    });

    _socket!.on('connect', (_) {
      print('🔌 [SOCKET] ✅ Connected');
      isConnected.value = true;
      _reconnectTimer?.cancel();
    });

    _socket!.on('disconnect', (reason) {
      print('🔌 [SOCKET] ❌ Disconnected: $reason');
      isConnected.value = false;
      _scheduleReconnect();
    });

    _socket!.on('connect_error', (err) {
      print('🔌 [SOCKET] ⚠️ Connection Error: $err');
      isConnected.value = false;
      _scheduleReconnect();
    });

    // Route all socket events into broadcast streams
    _socket!.on('LIVE_STATUS', (data) {
      if (data is Map) {
        _statusController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('LIVE_TELEMETRY', (data) {
      if (data is Map) {
        _telemetryController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('LIVE_HEARTBEAT', (data) {
      if (data is Map) {
        _heartbeatController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('LIVE_ALERT', (data) {
      if (data is Map) {
        _alertController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('LIVE_BOOT', (data) {
      if (data is Map) {
        _bootController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.connect();
  }

  /// Ensure the socket is connected (e.g. after app resume).
  /// Safe to call multiple times — no-op if already connected.
  void ensureConnected() {
    if (_socket?.connected != true) {
      connect();
    }
  }

  void _disconnect() {
    _socket?.dispose();
    _socket = null;
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (_socket?.connected != true) {
        print('🔌 [SOCKET] Attempting reconnect...');
        connect();
      }
    });
  }

  /// Disconnect and stop reconnection attempts.
  /// Call this on logout.
  void disconnect() {
    print('🔌 [SOCKET] Disconnecting (logout/cleanup)');
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _disconnect();
    isConnected.value = false;
  }

  @override
  void onClose() {
    disconnect();
    _statusController.close();
    _telemetryController.close();
    _heartbeatController.close();
    _alertController.close();
    _bootController.close();
    super.onClose();
  }
}
