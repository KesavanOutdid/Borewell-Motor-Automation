import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';

class DeviceHistoryController extends GetxController {
  final isLoading = false.obs;
  final records = <Map<String, dynamic>>[].obs;
  final summaryMetrics = <Map<String, String>>[].obs;

  final serialNumber = '-'.obs;
  final imeiNumber = '-'.obs;
  final lastUpdated = '-'.obs;
  final recordCount = 0.obs;
  final expandedIndex = Rxn<int>();

  late TokenService tokenService;

  String? _serialNumber;
  String? _imeiNumber;
  bool _initialized = false;
  static const Duration _istOffset = Duration(hours: 5, minutes: 30);

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  void initialize(Map<String, dynamic> args) {
    _serialNumber = args['serial_number']?.toString() ?? args['serialNumber']?.toString() ?? _serialNumber;
    _imeiNumber = args['imei_number']?.toString() ?? args['imeiNumber']?.toString() ?? _imeiNumber;

    serialNumber.value = _serialNumber ?? '-';
    if (_imeiNumber != null) {
      imeiNumber.value = _imeiNumber!;
    }

    if (!_initialized) {
      _initialized = true;
      fetchHistory();
    }
  }

  Future<void> fetchHistory() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();

    if (userId == null || token == null) {
      _handleUnauthorized();
      return;
    }

    isLoading.value = true;

    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.userDeviceHistoryEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'user_id': userId}),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true) {
          _applyHistoryData(json);
        } else {
          _clearHistory();
        }
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else {
        _showMessage('Failed to load history (${response.statusCode})');
      }
    } catch (e) {
      _showMessage('Connection failed: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> refreshHistory() async {
    await fetchHistory();
  }

  void toggleExpanded(int index) {
    if (expandedIndex.value == index) {
      expandedIndex.value = null;
    } else {
      expandedIndex.value = index;
    }
  }

  void _applyHistoryData(Map<String, dynamic> json) {
    final rawDevices = json['data'];
    if (rawDevices is! List || rawDevices.isEmpty) {
      _clearHistory();
      return;
    }

    final devices = <Map<String, dynamic>>[];
    for (final item in rawDevices) {
      if (item is Map) {
        devices.add(Map<String, dynamic>.from(item as Map));
      }
    }

    if (devices.isEmpty) {
      _clearHistory();
      return;
    }

    Map<String, dynamic>? target;
    if (_serialNumber != null && _serialNumber!.isNotEmpty) {
      for (final device in devices) {
        final serial = device['serial_number']?.toString();
        if (serial != null && serial == _serialNumber) {
          target = device;
          break;
        }
      }
    }

    target ??= devices.first;

    serialNumber.value = target['serial_number']?.toString() ?? serialNumber.value;
    lastUpdated.value = _formatDate(target['last_updated']) ?? '-';

    final rawRecords = target['records'];
    if (rawRecords is! List || rawRecords.isEmpty) {
      _clearHistory();
      return;
    }

    final parsedRecords = <Map<String, dynamic>>[];
    for (final item in rawRecords) {
      if (item is Map) {
        parsedRecords.add(Map<String, dynamic>.from(item as Map));
      }
    }

    if (parsedRecords.isEmpty) {
      _clearHistory();
      return;
    }

    records.assignAll(parsedRecords);
    recordCount.value = target['count'] is int ? target['count'] : parsedRecords.length;
    imeiNumber.value = parsedRecords.first['imei_number']?.toString() ?? imeiNumber.value;

    summaryMetrics.assignAll(_buildSummary(parsedRecords));
  }

  void _clearHistory() {
    records.clear();
    summaryMetrics.clear();
    recordCount.value = 0;
    lastUpdated.value = '-';
  }

  List<Map<String, String>> _buildSummary(List<Map<String, dynamic>> entries) {
    if (entries.isEmpty) return [];

    double totalEnergy = 0;
    double totalDuration = 0;
    double peakCurrent = 0;
    double peakVoltage = 0;

    for (final record in entries) {
      totalEnergy += _parseDouble(record['energy_kwh']);
      totalDuration += _parseDouble(record['duration_minutes']);
      final maxCurrent = _parseDouble(record['maxCurrent']);
      final maxVoltage = _parseDouble(record['maxVoltage']);
      if (maxCurrent > peakCurrent) {
        peakCurrent = maxCurrent;
      }
      if (maxVoltage > peakVoltage) {
        peakVoltage = maxVoltage;
      }
    }

    final avgDuration = entries.isEmpty ? 0 : totalDuration / entries.length;

    return [
      _metric('Total Energy', '${totalEnergy.toStringAsFixed(2)} kWh'),
      _metric('Avg Duration', '${avgDuration.toStringAsFixed(1)} min'),
      _metric('Peak Current', '${peakCurrent.toStringAsFixed(2)} A'),
      _metric('Peak Voltage', '${peakVoltage.toStringAsFixed(2)} V'),
    ];
  }

  Map<String, String> _metric(String label, String value) {
    return {'label': label, 'value': value};
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
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

  DateTime _convertToIst(DateTime dateTime) {
    final utcTime = dateTime.isUtc ? dateTime : dateTime.toUtc();
    return utcTime.add(_istOffset);
  }

  void _showMessage(String message) {
    Get.snackbar('History', message, snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
  }

  void _handleUnauthorized() {
    Get.offAllNamed('/login');
    Get.snackbar('Session expired', 'Please login again', snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 2));
  }
}
