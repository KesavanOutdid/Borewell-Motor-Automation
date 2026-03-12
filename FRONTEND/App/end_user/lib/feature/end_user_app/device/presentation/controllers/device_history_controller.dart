import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../utils/ui_utils.dart';

class DeviceHistoryController extends GetxController {
  final isLoading = false.obs;
  final isMoreLoading = false.obs;
  final records = <Map<String, dynamic>>[].obs;
  final summaryMetrics = <Map<String, String>>[].obs;

  final serialNumber = '-'.obs;
  final imeiNumber = '-'.obs;
  final lastUpdated = '-'.obs;
  final recordCount = 0.obs;
  final expandedIndex = Rxn<int>();

  final currentPage = 1.obs;
  final totalPages = 1.obs;
  final hasMore = true.obs;
  final int limit = 10;

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

  Future<void> fetchHistory({bool refresh = false}) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();

    if (userId == null || token == null) {
      _handleUnauthorized();
      return;
    }

    if (refresh) {
      currentPage.value = 1;
      hasMore.value = true;
      isLoading.value = true;
    } else {
      if (!hasMore.value || isMoreLoading.value) return;
      isMoreLoading.value = true;
    }

    try {
      final response = await http.post(
        Uri.parse(AppConfig.baseUrl + AppConfig.userDeviceHistoryEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'page': currentPage.value,
          'limit': limit,
          'serial_number': _serialNumber,
        }),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        if (json['success'] == true) {
          _applyHistoryData(json, refresh);
        } else {
          if (refresh) _clearHistory();
        }
      } else if (response.statusCode == 401) {
        _handleUnauthorized();
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      } else {
        _showMessage('Failed to load history (${response.statusCode})');
      }
    } catch (e) {
      _showMessage('Connection failed: $e');
    } finally {
      isLoading.value = false;
      isMoreLoading.value = false;
    }
  }

  Future<void> refreshHistory() async {
    await fetchHistory(refresh: true);
  }

  void toggleExpanded(int index) {
    if (expandedIndex.value == index) {
      expandedIndex.value = null;
    } else {
      expandedIndex.value = index;
    }
  }

  void _applyHistoryData(Map<String, dynamic> json, bool refresh) {
    // History data structure might vary depending on whether it's returning all devices or session records
    // Based on appControllers.js userDeviceHistory returns { data: sessions[], total, totalPages, currentPage }
    
    final rawSessions = json['data'];
    if (rawSessions is! List) {
      if (refresh) _clearHistory();
      return;
    }

    final parsedSessions = rawSessions.map((item) => Map<String, dynamic>.from(item as Map)).toList();

    if (refresh) {
      records.assignAll(parsedSessions);
    } else {
      records.addAll(parsedSessions);
    }

    totalPages.value = json['totalPages'] ?? 1;
    currentPage.value = (json['currentPage'] ?? currentPage.value) + 1;
    hasMore.value = currentPage.value <= totalPages.value;
    
    recordCount.value = json['total'] ?? records.length;

    // Optional: update metrics if needed
    summaryMetrics.assignAll(_buildSummary(records));
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

  void _handleDeactivated() {
    UIUtils.handleAccountDeactivated();
  }
}
