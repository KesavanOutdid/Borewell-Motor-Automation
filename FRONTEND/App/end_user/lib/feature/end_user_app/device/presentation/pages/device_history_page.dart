import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/device_history_controller.dart';

class DeviceHistoryView extends StatefulWidget {
  const DeviceHistoryView({super.key});

  @override
  State<DeviceHistoryView> createState() => _DeviceHistoryViewState();
}

class _DeviceHistoryViewState extends State<DeviceHistoryView> {
  int? _expandedIndex;

  static const Duration _istOffset = Duration(hours: 5, minutes: 30);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DeviceHistoryController());
    final rawArgs = Get.arguments;
    controller.initialize(rawArgs is Map<String, dynamic> ? rawArgs : <String, dynamic>{});

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device History'),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.records.isEmpty) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    _buildHeader(controller),
                    const SizedBox(height: 8),
                    _buildSummaryGrid(controller),
                  ],
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: controller.refreshHistory,
                  child: ListView(
                    padding: const EdgeInsets.all(32),
                    children: const [
                      Icon(Icons.history, size: 72, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No telemetry records found',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  _buildHeader(controller),
                  const SizedBox(height: 8),
                  _buildSummaryGrid(controller),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: controller.refreshHistory,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: controller.records.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildRecordCard(
                        controller.records[index],
                        index + 1,
                        index,
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildHeader(DeviceHistoryController controller) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.memory, size: 18, color: Colors.green),
            const SizedBox(width: 8),
            Expanded(
              child: Obx(
                () => Text(
                  controller.serialNumber.value,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            Obx(
              () => Text(
                '${controller.recordCount.value} records',
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryGrid(DeviceHistoryController controller) {
    return Obx(() {
      if (controller.summaryMetrics.isEmpty) {
        return const SizedBox.shrink();
      }

      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 2.2,
        ),
        itemCount: controller.summaryMetrics.length,
        itemBuilder: (context, index) {
          final metric = controller.summaryMetrics[index];
          return Card(
            elevation: 1,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    metric['label'] ?? '-',
                    style: const TextStyle(fontSize: 11, color: Colors.black54),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    metric['value'] ?? '-',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          );
        },
      );
    });
  }

  Widget _buildRecordCard(Map<String, dynamic> record, int displayIndex, int actualIndex) {
    final isExpanded = _expandedIndex == actualIndex;
    final chips = [
      _chipData('Energy', _formatNumber(record['energy_kwh'], 'kWh')),
      _chipData('Duration', _formatDuration(record['duration_minutes'])),
      _chipData('Current', _formatRange(record['minCurrent'], record['maxCurrent'], 'A')),
      _chipData('Voltage', _formatRange(record['minVoltage'], record['maxVoltage'], 'V')),
    ]
        .where((chip) => chip['value'] != '-')
        .toList();

    return Card(
      elevation: 2,
      child: InkWell(
        onTap: () {
          setState(() {
            _expandedIndex = isExpanded ? null : actualIndex;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Record $displayIndex',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _formatDateOnly(record['date'] ?? record['startAt']),
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey,
                  ),
                ],
              ),
              if (!isExpanded) ...[
                const SizedBox(height: 8),
                Text(
                  'Duration: ${_formatDuration(record['duration_minutes'])}',
                  style: const TextStyle(fontSize: 13, color: Colors.black87),
                ),
              ],
              if (isExpanded) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _infoTile('Start', _formatDate(record['startAt'])),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _infoTile('Stop', _formatDate(record['stopAt'])),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _infoTile('Duration', _formatDuration(record['duration_minutes'])),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: chips
                      .map((chip) => _metricChip(chip['label']!, chip['value']!))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Map<String, String> _chipData(String label, String value) {
    return {'label': label, 'value': value};
  }

  Widget _metricChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.black54)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.black45)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
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

  String _formatDuration(dynamic value) {
    if (value == null) return '-';
    if (value is Duration) {
      return _durationToString(value);
    }
    if (value is num) {
      final duration = Duration(minutes: value.toInt());
      return _durationToString(duration);
    }
    return value.toString();
  }

  String _durationToString(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    if (minutes > 0) {
      return '${minutes}m';
    }
    return '${duration.inMinutes}m';
  }

  String _formatRange(dynamic minValue, dynamic maxValue, String unit) {
    final min = _parseDouble(minValue);
    final max = _parseDouble(maxValue);

    if (min == null && max == null) return '-';
    if (min != null && max != null) {
      if (min == max) {
        return '${min.toStringAsFixed(2)} $unit';
      }
      return '${min.toStringAsFixed(2)} - ${max.toStringAsFixed(2)} $unit';
    }
    final value = (min ?? max)!;
    return '${value.toStringAsFixed(2)} $unit';
  }

  String _formatNumber(dynamic value, String unit) {
    final parsed = _parseDouble(value);
    if (parsed == null) return '-';
    return '${parsed.toStringAsFixed(2)} $unit';
  }
  String _formatDateOnly(dynamic value) {
  if (value == null) return '-';
  try {
    final dateTime = value is DateTime ? value : DateTime.parse(value.toString());
    final istTime = _convertToIst(dateTime);
    final twoDigits = (int v) => v.toString().padLeft(2, '0');

    return '${twoDigits(istTime.day)}/${twoDigits(istTime.month)}/${istTime.year}';
  } catch (_) {
    return value.toString();
  }
}
  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}
