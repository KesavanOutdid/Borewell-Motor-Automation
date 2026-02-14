import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/device_history_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class DeviceHistoryView extends StatelessWidget {
  const DeviceHistoryView({super.key});

  static const Duration _istOffset = Duration(hours: 5, minutes: 30);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DeviceHistoryController());
    final rawArgs = Get.arguments;
    controller.initialize(rawArgs is Map<String, dynamic> ? rawArgs : <String, dynamic>{});

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Device History'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        return RefreshIndicator(
          onRefresh: controller.refreshHistory,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: _buildHeader(controller),
                ),
              ),
              if (controller.summaryMetrics.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: _buildSummaryGrid(controller),
                  ),
                ),
              if (controller.records.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history_rounded, size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text(
                          'No telemetry records found',
                          style: TextStyle(fontSize: 16, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildRecordCard(
                            context,
                            controller,
                            controller.records[index],
                            index + 1,
                            index,
                          ),
                        );
                      },
                      childCount: controller.records.length,
                    ),
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildHeader(DeviceHistoryController controller) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.history_toggle_off_rounded, color: AppColors.primaryGreen, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Records',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Obx(() => Text(
                  controller.serialNumber.value,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                )),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Obx(() => Text(
              '${controller.recordCount.value} Records',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
            )),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryGrid(DeviceHistoryController controller) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Performance Summary',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.0,
            ),
            itemCount: controller.summaryMetrics.length,
            itemBuilder: (context, index) {
              final metric = controller.summaryMetrics[index];
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.04),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      metric['label'] ?? '-',
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade600, fontWeight: FontWeight.w600, letterSpacing: 0.2),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      metric['value'] ?? '-',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecordCard(BuildContext context, DeviceHistoryController controller, Map<String, dynamic> record, int displayIndex, int actualIndex) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: Obx(() {
          final isExpanded = controller.expandedIndex.value == actualIndex;
          return ExpansionTile(
            key: ValueKey('history_record_$actualIndex'),
            initiallyExpanded: isExpanded,
            onExpansionChanged: (expanded) {
              controller.toggleExpanded(actualIndex);
            },
            tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Record #$displayIndex',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _formatDateOnly(record['date'] ?? record['startAt']),
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                ),
              ],
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(
                children: [
                  Icon(Icons.schedule_rounded, size: 14, color: AppColors.primaryGreen.withValues(alpha: 0.6)),
                  const SizedBox(width: 4),
                  Text(
                    _formatDuration(record['duration_minutes']),
                    style: TextStyle(fontSize: 13, color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.person_outline_rounded, size: 14, color: Colors.grey.shade400),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'By ${record['started_by'] ?? '-'}',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: Column(
                  children: [
                    Divider(color: Colors.grey.shade100, height: 24),
                    Row(
                      children: [
                        Expanded(child: _infoTile('Start Time', _formatDate(record['startAt']))),
                        const SizedBox(width: 12),
                        Expanded(child: _infoTile('Stop Time', _formatDate(record['stopAt']))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _infoTile('Started By', record['started_by'] ?? '-')),
                        const SizedBox(width: 12),
                        Expanded(child: _infoTile('Stopped By', record['stopped_by'] ?? '-')),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.grey.shade100),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _metricTileSmall('Energy', _formatNumber(record['energy_kwh'], 'kWh'))),
                          _divider(),
                          Expanded(child: _metricTileSmall('Duration', _formatDuration(record['duration_minutes']))),
                          _divider(),
                          Expanded(child: _metricTileSmall('Current', _formatRange(record['minCurrent'], record['maxCurrent'], 'A'))),
                          _divider(),
                          Expanded(child: _metricTileSmall('Voltage', _formatRange(record['minVoltage'], record['maxVoltage'], 'V'))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _divider() => Container(width: 1, height: 24, color: Colors.grey.shade200, margin: const EdgeInsets.symmetric(horizontal: 8));

  Widget _metricTileSmall(String label, String value) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 8, color: Colors.grey.shade500, fontWeight: FontWeight.w600, letterSpacing: 0.3)),
        const SizedBox(height: 4),
        Text(
          value, 
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _metricTile(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 9, color: Colors.grey.shade500, fontWeight: FontWeight.w600, letterSpacing: 0.3)),
          const SizedBox(height: 2),
          Text(
            value, 
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
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
      String twoDigits(int v) => v.toString().padLeft(2, '0');
      final hour = istTime.hour == 0 ? 12 : (istTime.hour > 12 ? istTime.hour - 12 : istTime.hour);
      final period = istTime.hour >= 12 ? 'PM' : 'AM';
      return '${twoDigits(istTime.day)}/${twoDigits(istTime.month)} ${twoDigits(hour)}:${twoDigits(istTime.minute)} $period';
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
    if (value is Duration) return _durationToString(value);
    if (value is num) return _durationToString(Duration(minutes: value.toInt()));
    return value.toString();
  }

  String _durationToString(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    if (hours > 0) return '${hours}h ${minutes}m';
    return '${minutes}m';
  }

  String _formatRange(dynamic minValue, dynamic maxValue, String unit) {
    final min = _parseDouble(minValue);
    final max = _parseDouble(maxValue);
    if (min == null && max == null) return '-';
    if (min != null && max != null) {
      if (min == max) return '${min.toStringAsFixed(1)} $unit';
      return '${min.toStringAsFixed(1)}-${max.toStringAsFixed(1)} $unit';
    }
    final value = (min ?? max)!;
    return '${value.toStringAsFixed(1)} $unit';
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
      String twoDigits(int v) => v.toString().padLeft(2, '0');
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
