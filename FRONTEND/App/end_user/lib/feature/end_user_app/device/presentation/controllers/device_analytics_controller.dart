import 'dart:convert';
import 'dart:io';
import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../domain/models/analytics_data.dart';

class DeviceAnalyticsController extends GetxController {
  final isLoading = false.obs;
  final analyticsData = Rx<AnalyticsData?>(null);
  final selectedMetricType = 'motor_rpm'.obs;
  final selectedPeriod = 'today'.obs;
  final logger = Logger();
  
  late TokenService tokenService;
  
  String? serialNumber;
  String? imeiNumber;

  final List<Map<String, dynamic>> metricTypes = [
    {
      'value': 'motor_rpm',
      'label': 'Motor RPM',
      'color': 0xFF6366F1,
      'icon': 0xe5d2,
    },
    {
      'value': 'motor_frequency_hz',
      'label': 'Motor Frequency',
      'color': 0xFF8B5CF6,
      'icon': 0xe1ce,
    },
    {
      'value': 'power_kw',
      'label': 'Power',
      'color': 0xFF14B8A6,
      'icon': 0xe1e1,
    },
    {
      'value': 'current_rms',
      'label': 'Current',
      'color': 0xFFF59E0B,
      'icon': 0xe3e6,
    },
    {
      'value': 'voltage_rms',
      'label': 'Voltage',
      'color': 0xFFEF4444,
      'icon': 0xe1e2,
    },
    {
      'value': 'energy_kwh',
      'label': 'Energy',
      'color': 0xFFEC4899,
      'icon': 0xe3e9,
    },
    {
      'value': 'device_temp_c',
      'label': 'Temperature',
      'color': 0xFFF97316,
      'icon': 0xe40f,
    },
    {
      'value': 'signal_strength',
      'label': 'Signal',
      'color': 0xFF10B981,
      'icon': 0xe1f0,
    },
  ];

  @override
  void onInit() {
    super.onInit();
    tokenService = Get.find<TokenService>();
  }

  void initialize(Map<String, dynamic> args) {
    serialNumber = args['serial_number'] ?? args['serialNumber'];
    imeiNumber = args['imei_number'] ?? args['imeiNumber'];
    
    if (serialNumber != null && imeiNumber != null) {
      fetchAnalytics(selectedMetricType.value);
    }
  }

  Future<void> fetchAnalytics(String type) async {
    if (serialNumber == null || imeiNumber == null) {
      logger.e('Missing device information: serial=$serialNumber, imei=$imeiNumber');
      _showMessage('Missing device information');
      return;
    }

    final token = tokenService.getToken();
    if (token == null) {
      logger.e('No auth token available');
      _handleUnauthorized();
      return;
    }

    isLoading.value = true;
    selectedMetricType.value = type;

    try {
      final uri = Uri.parse(AppConfig.baseUrl + AppConfig.analyticsEndpoint).replace(
        queryParameters: {
          'type': type,
          'serial_number': serialNumber,
          'imei_number': imeiNumber,
        },
      );

      logger.i('Fetching analytics from: $uri');
      logger.d('Request headers: Content-Type=application/json, Authorization=Bearer [TOKEN]');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      logger.i('Response status: ${response.statusCode}');
      logger.d('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        logger.d('Parsed JSON: $json');
        
        if (json['success'] == true || json['data'] != null) {
          final data = json['data'] ?? json;
          logger.i('Analytics data received successfully');
          analyticsData.value = AnalyticsData.fromJson(data);
          
          _checkForAnomalies();
        } else {
          logger.w('Response missing success or data field');
          _showMessage('Unable to load analytics');
        }
      } else if (response.statusCode == 401) {
        logger.e('Unauthorized: ${response.body}');
        _handleUnauthorized();
      } else if (response.statusCode == 400) {
        logger.e('Bad request: ${response.body}');
        _showMessage('Invalid parameters');
      } else if (response.statusCode == 404) {
        logger.w('Analytics endpoint not implemented, using mock data');
        _useMockData();
      } else {
        logger.e('Failed with status ${response.statusCode}: ${response.body}');
        _showMessage('Failed to load analytics (${response.statusCode})');
      }
    } catch (e, stackTrace) {
      logger.e('Connection failed', error: e, stackTrace: stackTrace);
      _showMessage('Connection failed: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> refreshAnalytics() async {
    await fetchAnalytics(selectedMetricType.value);
  }

  void _showMessage(String message) {
    Get.snackbar(
      'Analytics',
      message,
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 2),
    );
  }

  void _handleUnauthorized() {
    Get.offAllNamed('/auth/login');
    Get.snackbar(
      'Session Expired',
      'Please login again',
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 3),
    );
  }

  void _useMockData() {
    final mockData = {
      'hourly': List.generate(24, (i) => {
        'label': '${i}:00',
        'value': 1400.0 + (i * 15) + (i % 3 == 0 ? 50 : -30),
      }),
      'today': List.generate(24, (i) => {
        'label': '${i}:00',
        'value': 1420.0 + (i * 20) + (i % 2 == 0 ? 80 : -40),
      }),
      'weekly': List.generate(7, (i) => {
        'label': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        'value': 1500.0 + (i * 100) + (i % 2 == 0 ? 150 : -100),
      }),
      'monthly': List.generate(30, (i) => {
        'label': '${i + 1}',
        'value': 1300.0 + (i * 50) + (i % 5 == 0 ? 200 : -100),
      }),
      'yearly': List.generate(5, (i) => {
        'label': '${2020 + i}',
        'value': 1450.0 + (i * 150),
      }),
    };
    
    analyticsData.value = AnalyticsData.fromJson(mockData);
    logger.i('Using mock analytics data');
  }

  void _checkForAnomalies() {
    final data = analyticsData.value;
    if (data?.overallStats == null) return;
    
    final overallStats = data!.overallStats!;
    
    if (overallStats.totalAnomalies > 0) {
      final performanceScore = overallStats.averagePerformance;
      
      if (performanceScore < 50) {
        Get.snackbar(
          '⚠️ Critical Alert',
          'Performance score is critically low (${performanceScore}%). ${overallStats.totalAnomalies} anomalies detected.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFFEF4444),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 5),
          icon: const Icon(Icons.error, color: Color(0xFFFFFFFF)),
        );
      } else if (performanceScore < 70) {
        Get.snackbar(
          '⚠️ Warning',
          'Performance score is below optimal (${performanceScore}%). ${overallStats.totalAnomalies} anomalies detected.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFFF59E0B),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 4),
          icon: const Icon(Icons.warning, color: Color(0xFFFFFFFF)),
        );
      } else if (overallStats.totalAnomalies >= 5) {
        Get.snackbar(
          'ℹ️ Notice',
          'Multiple anomalies detected (${overallStats.totalAnomalies}). Please review device performance.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFF3B82F6),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 3),
          icon: const Icon(Icons.info, color: Color(0xFFFFFFFF)),
        );
      }
    }
    
    if (data.summary != null) {
      final currentStats = data.summary!.getPeriodStats(selectedPeriod.value);
      
      if (currentStats.consistency == 'poor') {
        Get.snackbar(
          '📊 Data Quality Alert',
          'Device readings show poor consistency. Consider checking device calibration.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFFF97316),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 4),
        );
      }
      
      if (currentStats.reliability < 70) {
        Get.snackbar(
          '🔧 Reliability Alert',
          'Device reliability is ${currentStats.reliability.toStringAsFixed(1)}%. Maintenance may be required.',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFFEF4444),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 4),
        );
      }
    }
    
    if (data.comparisons != null) {
      final comparison = data.comparisons!.getComparison(selectedPeriod.value);
      
      if (comparison.trend == 'declining' && comparison.percentChange < -20) {
        Get.snackbar(
          '📉 Performance Decline',
          'Significant performance drop detected (${comparison.percentChange.toStringAsFixed(1)}% decrease)',
          snackPosition: SnackPosition.TOP,
          backgroundColor: const Color(0xFFDC2626),
          colorText: const Color(0xFFFFFFFF),
          duration: const Duration(seconds: 4),
          icon: const Icon(Icons.trending_down, color: Color(0xFFFFFFFF)),
        );
      }
    }
  }

  Future<void> exportAnalytics() async {
    try {
      if (analyticsData.value == null) {
        _showMessage('No data available to export');
        return;
      }

      final data = analyticsData.value!;
      final selectedMetric = metricTypes.firstWhere(
        (m) => m['value'] == selectedMetricType.value,
        orElse: () => metricTypes[0],
      );

      List<List<dynamic>> csvData = [
        ['Auto Harvest - Analytics Report'],
        ['Device Serial:', serialNumber ?? 'N/A'],
        ['Device IMEI:', imeiNumber ?? 'N/A'],
        ['Metric Type:', selectedMetric['label']],
        ['Period:', selectedPeriod.value.toUpperCase()],
        ['Generated At:', DateTime.now().toString()],
        [],
        ['Label', 'Value', 'Timestamp'],
      ];

      List<ChartDataPoint> dataPoints;
      switch (selectedPeriod.value) {
        case 'hourly':
          dataPoints = data.hourly;
          break;
        case 'weekly':
          dataPoints = data.weekly;
          break;
        case 'monthly':
          dataPoints = data.monthly;
          break;
        case 'yearly':
          dataPoints = data.yearly;
          break;
        case 'today':
        default:
          dataPoints = data.today;
      }

      for (var point in dataPoints) {
        csvData.add([
          point.label,
          point.value.toStringAsFixed(2),
          point.timestamp?.toString() ?? 'N/A',
        ]);
      }

      if (data.summary != null) {
        final stats = data.summary!.getPeriodStats(selectedPeriod.value);
        csvData.addAll([
          [],
          ['Statistics Summary'],
          ['Data Points', stats.dataPoints],
          ['Average', stats.average.toStringAsFixed(2)],
          ['Minimum', stats.min.toStringAsFixed(2)],
          ['Maximum', stats.max.toStringAsFixed(2)],
          ['Trend', stats.trend],
          ['Percent Change', '${stats.percentChange.toStringAsFixed(2)}%'],
          ['Standard Deviation', stats.standardDeviation.toStringAsFixed(2)],
          ['Performance Score', '${stats.performanceScore}/100'],
          ['Reliability', '${stats.reliability.toStringAsFixed(1)}%'],
          ['Consistency', stats.consistency],
          ['Anomaly Count', stats.anomalyCount],
        ]);

        if (stats.peakHour != null) {
          csvData.add(['Peak Hour', stats.peakHour!.label, stats.peakHour!.value.toStringAsFixed(2)]);
        }
        if (stats.lowestHour != null) {
          csvData.add(['Lowest Hour', stats.lowestHour!.label, stats.lowestHour!.value.toStringAsFixed(2)]);
        }
      }

      if (data.comparisons != null) {
        final comparison = data.comparisons!.getComparison(selectedPeriod.value);
        if (comparison.trend != 'insufficient_data') {
          csvData.addAll([
            [],
            ['Comparison Analysis'],
            ['Label', comparison.label],
            ['Previous Average', comparison.previousAverage.toStringAsFixed(2)],
            ['Current Average', comparison.currentAverage.toStringAsFixed(2)],
            ['Absolute Change', comparison.absoluteChange.toStringAsFixed(2)],
            ['Percent Change', '${comparison.percentChange.toStringAsFixed(2)}%'],
            ['Trend', comparison.trend],
          ]);
        }
      }

      String csv = const ListToCsvConverter().convert(csvData);

      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'analytics_${selectedMetricType.value}_${selectedPeriod.value}_$timestamp.csv';
      final filePath = '${directory.path}/$fileName';
      
      final file = File(filePath);
      await file.writeAsString(csv);

      logger.i('Analytics exported to: $filePath');

      await Share.shareXFiles(
        [XFile(filePath)],
        subject: 'Analytics Report - ${selectedMetric['label']}',
        text: 'Analytics report for device $serialNumber',
      );

      _showMessage('Analytics exported successfully');
    } catch (e, stackTrace) {
      logger.e('Export failed', error: e, stackTrace: stackTrace);
      _showMessage('Failed to export analytics: $e');
    }
  }

  Future<void> exportToPDF() async {
    try {
      if (analyticsData.value == null) {
        _showMessage('No data available to export');
        return;
      }

      final data = analyticsData.value!;
      final selectedMetric = metricTypes.firstWhere(
        (m) => m['value'] == selectedMetricType.value,
        orElse: () => metricTypes[0],
      );

      List<ChartDataPoint> dataPoints;
      switch (selectedPeriod.value) {
        case 'hourly':
          dataPoints = data.hourly;
          break;
        case 'weekly':
          dataPoints = data.weekly;
          break;
        case 'monthly':
          dataPoints = data.monthly;
          break;
        case 'yearly':
          dataPoints = data.yearly;
          break;
        case 'today':
        default:
          dataPoints = data.today;
      }

      final pdf = pw.Document();

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          build: (pw.Context context) {
            return [
              pw.Header(
                level: 0,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Auto Harvest - Analytics Report',
                      style: pw.TextStyle(
                        fontSize: 24,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.green700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Divider(color: PdfColors.green700, thickness: 2),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('Device Serial: ${serialNumber ?? 'N/A'}', style: const pw.TextStyle(fontSize: 12)),
                      pw.SizedBox(height: 4),
                      pw.Text('Device IMEI: ${imeiNumber ?? 'N/A'}', style: const pw.TextStyle(fontSize: 12)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Metric: ${selectedMetric['label']}', style: const pw.TextStyle(fontSize: 12)),
                      pw.SizedBox(height: 4),
                      pw.Text('Period: ${selectedPeriod.value.toUpperCase()}', style: const pw.TextStyle(fontSize: 12)),
                      pw.SizedBox(height: 4),
                      pw.Text('Generated: ${DateTime.now().toString().split('.')[0]}', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                    ],
                  ),
                ],
              ),
              
              pw.SizedBox(height: 24),

              if (data.overallStats != null) ...[
                pw.Container(
                  padding: const pw.EdgeInsets.all(16),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.green50,
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Overall Performance',
                        style: pw.TextStyle(
                          fontSize: 18,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.green900,
                        ),
                      ),
                      pw.SizedBox(height: 12),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
                        children: [
                          _buildPdfStatItem('Performance', '${data.overallStats!.averagePerformance}%'),
                          _buildPdfStatItem('Data Points', '${data.overallStats!.totalDataPoints}'),
                          _buildPdfStatItem('Anomalies', '${data.overallStats!.totalAnomalies}'),
                        ],
                      ),
                    ],
                  ),
                ),
                pw.SizedBox(height: 16),
              ],

              if (data.summary != null) ...[
                pw.Text(
                  'Statistics Summary',
                  style: pw.TextStyle(
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.SizedBox(height: 12),
                _buildPdfStatsTable(data.summary!.getPeriodStats(selectedPeriod.value)),
                pw.SizedBox(height: 16),
              ],

              pw.Text(
                'Chart Data',
                style: pw.TextStyle(
                  fontSize: 16,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 12),
              _buildPdfDataTable(dataPoints),

              if (data.comparisons != null) ...[
                pw.SizedBox(height: 16),
                pw.Text(
                  'Comparison Analysis',
                  style: pw.TextStyle(
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.SizedBox(height: 12),
                _buildPdfComparisonTable(data.comparisons!.getComparison(selectedPeriod.value)),
              ],
            ];
          },
        ),
      );

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
        name: 'analytics_${selectedMetricType.value}_${selectedPeriod.value}.pdf',
      );

      _showMessage('PDF generated successfully');
    } catch (e, stackTrace) {
      logger.e('PDF export failed', error: e, stackTrace: stackTrace);
      _showMessage('Failed to generate PDF: $e');
    }
  }

  pw.Widget _buildPdfStatItem(String label, String value) {
    return pw.Column(
      children: [
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 20,
            fontWeight: pw.FontWeight.bold,
            color: PdfColors.green700,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          label,
          style: const pw.TextStyle(
            fontSize: 10,
            color: PdfColors.grey700,
          ),
        ),
      ],
    );
  }

  pw.Widget _buildPdfStatsTable(PeriodStats stats) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      children: [
        _buildPdfTableRow('Data Points', '${stats.dataPoints}', true),
        _buildPdfTableRow('Average', stats.average.toStringAsFixed(2), false),
        _buildPdfTableRow('Minimum', stats.min.toStringAsFixed(2), true),
        _buildPdfTableRow('Maximum', stats.max.toStringAsFixed(2), false),
        _buildPdfTableRow('Trend', stats.trend, true),
        _buildPdfTableRow('Percent Change', '${stats.percentChange.toStringAsFixed(2)}%', false),
        _buildPdfTableRow('Std Deviation', stats.standardDeviation.toStringAsFixed(2), true),
        _buildPdfTableRow('Performance Score', '${stats.performanceScore}/100', false),
        _buildPdfTableRow('Reliability', '${stats.reliability.toStringAsFixed(1)}%', true),
        _buildPdfTableRow('Consistency', stats.consistency, false),
        _buildPdfTableRow('Anomaly Count', '${stats.anomalyCount}', true),
        if (stats.peakHour != null)
          _buildPdfTableRow('Peak Hour', '${stats.peakHour!.label} (${stats.peakHour!.value.toStringAsFixed(2)})', false),
        if (stats.lowestHour != null)
          _buildPdfTableRow('Lowest Hour', '${stats.lowestHour!.label} (${stats.lowestHour!.value.toStringAsFixed(2)})', true),
      ],
    );
  }

  pw.TableRow _buildPdfTableRow(String label, String value, bool isEven) {
    return pw.TableRow(
      decoration: pw.BoxDecoration(
        color: isEven ? PdfColors.grey100 : PdfColors.white,
      ),
      children: [
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(label, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.all(8),
          child: pw.Text(value, style: const pw.TextStyle(fontSize: 10)),
        ),
      ],
    );
  }

  pw.Widget _buildPdfDataTable(List<ChartDataPoint> dataPoints) {
    final displayData = dataPoints.length > 50 ? dataPoints.sublist(0, 50) : dataPoints;
    
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      columnWidths: {
        0: const pw.FlexColumnWidth(1),
        1: const pw.FlexColumnWidth(1),
        2: const pw.FlexColumnWidth(2),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.green700),
          children: [
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text('Label', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.white)),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text('Value', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.white)),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text('Timestamp', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.white)),
            ),
          ],
        ),
        ...displayData.asMap().entries.map((entry) {
          final index = entry.key;
          final point = entry.value;
          return pw.TableRow(
            decoration: pw.BoxDecoration(
              color: index.isEven ? PdfColors.grey100 : PdfColors.white,
            ),
            children: [
              pw.Padding(
                padding: const pw.EdgeInsets.all(6),
                child: pw.Text(point.label, style: const pw.TextStyle(fontSize: 9)),
              ),
              pw.Padding(
                padding: const pw.EdgeInsets.all(6),
                child: pw.Text(point.value.toStringAsFixed(2), style: const pw.TextStyle(fontSize: 9)),
              ),
              pw.Padding(
                padding: const pw.EdgeInsets.all(6),
                child: pw.Text(point.timestamp?.toString().split('.')[0] ?? 'N/A', style: const pw.TextStyle(fontSize: 8)),
              ),
            ],
          );
        }).toList(),
      ],
    );
  }

  pw.Widget _buildPdfComparisonTable(ComparisonData comparison) {
    if (comparison.trend == 'insufficient_data') {
      return pw.Text('Insufficient data for comparison', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700));
    }

    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey300),
      children: [
        _buildPdfTableRow('Label', comparison.label, true),
        _buildPdfTableRow('Previous Average', comparison.previousAverage.toStringAsFixed(2), false),
        _buildPdfTableRow('Current Average', comparison.currentAverage.toStringAsFixed(2), true),
        _buildPdfTableRow('Absolute Change', comparison.absoluteChange.toStringAsFixed(2), false),
        _buildPdfTableRow('Percent Change', '${comparison.percentChange.toStringAsFixed(2)}%', true),
        _buildPdfTableRow('Trend', comparison.trend, false),
      ],
    );
  }
}
