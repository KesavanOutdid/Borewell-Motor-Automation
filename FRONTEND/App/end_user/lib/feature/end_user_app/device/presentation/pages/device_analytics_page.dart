import 'dart:math';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fl_chart/fl_chart.dart';

import '../controllers/device_analytics_controller.dart';
import '../../domain/models/analytics_data.dart';

class DeviceAnalyticsView extends StatelessWidget {
  const DeviceAnalyticsView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(DeviceAnalyticsController());
    final rawArgs = Get.arguments;
    controller.initialize(rawArgs is Map<String, dynamic> ? rawArgs : <String, dynamic>{});

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(context, controller),
            Expanded(
              child: Obx(() {
                if (controller.isLoading.value) {
                  return _buildLoadingState();
                }

                if (controller.analyticsData.value == null) {
                  return _buildEmptyState();
                }

                return _buildDashboard(controller);
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, DeviceAnalyticsController controller) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade400, Colors.green.shade600],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                  padding: const EdgeInsets.all(10),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Analytics Dashboard',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D3748),
                      ),
                    ),
                    Text(
                      'Real-time device telemetry',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Obx(() => Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade400, Colors.green.shade600],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.refresh, color: Colors.white, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      controller.selectedPeriod.value.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ),
          const SizedBox(height: 16),
          _buildMetricTabs(controller),
        ],
      ),
    );
  }

  Widget _buildMetricTabs(DeviceAnalyticsController controller) {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: controller.metricTypes.length,
        itemBuilder: (context, index) {
          final metric = controller.metricTypes[index];
          final color = Color(metric['color'] as int);

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Obx(() {
              final isSelected = controller.selectedMetricType.value == metric['value'];
              
              return Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => controller.fetchAnalytics(metric['value'] as String),
                  borderRadius: BorderRadius.circular(25),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? LinearGradient(
                              colors: [color, color.withOpacity(0.8)],
                            )
                          : LinearGradient(
                              colors: [Colors.grey.shade100, Colors.grey.shade100],
                            ),
                      borderRadius: BorderRadius.circular(25),
                    ),
                    child: Row(
                      children: [
                        // Icon(
                        //   IconData(metric['icon'] as int, fontFamily: 'MaterialIcons'),
                        //   color: isSelected ? Colors.white : color,
                        //   size: 20,
                        // ),
                        const SizedBox(width: 8),
                        Text(
                          metric['label'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          );
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  shape: BoxShape.circle,
                ),
              ),
              SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  strokeWidth: 4,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green.shade400),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Loading Analytics...',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2D3748),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.analytics_outlined, size: 64, color: Colors.green.shade300),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Data Available',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3748),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Unable to fetch analytics data',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboard(DeviceAnalyticsController controller) {
    return Obx(() {
      final data = controller.analyticsData.value;
      if (data == null) return const SizedBox();

      List<ChartDataPoint> chartData;
      switch (controller.selectedPeriod.value) {
        case 'hourly':
          chartData = data.hourly;
          break;
        case 'weekly':
          chartData = data.weekly;
          break;
        case 'monthly':
          chartData = data.monthly;
          break;
        case 'yearly':
          chartData = data.yearly;
          break;
        case 'today':
        default:
          chartData = data.today;
      }

      if (chartData.isEmpty) {
        return _buildEmptyState();
      }

      return RefreshIndicator(
        onRefresh: controller.refreshAnalytics,
        color: Colors.green.shade400,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildPeriodSelector(controller),
              const SizedBox(height: 16),
              if (data.overallStats != null)
                _buildOverallStatsCard(data.overallStats!),
              if (data.overallStats != null)
                const SizedBox(height: 16),
              _buildPerformanceCard(controller, chartData),
              const SizedBox(height: 16),
              _buildMetricsRow(chartData),
              const SizedBox(height: 16),
              if (data.summary != null)
                _buildPerformanceScoreCard(controller),
              if (data.summary != null)
                const SizedBox(height: 16),
              _buildDailyOverview(chartData),
              const SizedBox(height: 16),
              _buildDetailedStats(controller, chartData),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildPeriodSelector(DeviceAnalyticsController controller) {
    final periods = [
      {'value': 'hourly', 'label': 'Hourly', 'icon': Icons.access_time},
      {'value': 'today', 'label': 'Today', 'icon': Icons.today},
      {'value': 'weekly', 'label': 'Weekly', 'icon': Icons.date_range},
      {'value': 'monthly', 'label': 'Monthly', 'icon': Icons.calendar_month},
      {'value': 'yearly', 'label': 'Yearly', 'icon': Icons.calendar_today},
    ];

    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: periods.map((period) {
          return Expanded(
            child: Obx(() {
              final isSelected = controller.selectedPeriod.value == period['value'];
              return InkWell(
                onTap: () => controller.selectedPeriod.value = period['value'] as String,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(
                            colors: [Colors.green.shade400, Colors.green.shade600],
                          )
                        : null,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        period['icon'] as IconData,
                        color: isSelected ? Colors.white : Colors.grey[600],
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        period['label'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? Colors.white : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildOverallStatsCard(OverallStats stats) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade400, Colors.green.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Overall Performance',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildOverallStatItem(
                  'Performance',
                  '${stats.averagePerformance}%',
                  Icons.speed,
                ),
              ),
              Expanded(
                child: _buildOverallStatItem(
                  'Data Points',
                  '${stats.totalDataPoints}',
                  Icons.data_usage,
                ),
              ),
              Expanded(
                child: _buildOverallStatItem(
                  'Anomalies',
                  '${stats.totalAnomalies}',
                  Icons.warning_amber_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverallStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Icon(icon, color: Colors.white, size: 28),
        ),
        const SizedBox(height: 12),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.9),
          ),
        ),
      ],
    );
  }

  Widget _buildPerformanceScoreCard(DeviceAnalyticsController controller) {
    return Obx(() {
      final analyticsData = controller.analyticsData.value;
      if (analyticsData?.summary == null) return const SizedBox();
      
      final stats = analyticsData!.summary!.getPeriodStats(controller.selectedPeriod.value);
      final comparison = analyticsData.comparisons?.getComparison(controller.selectedPeriod.value);
      
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Performance Insights',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3748),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildInsightCard(
                    'Score',
                    '${stats.performanceScore}/100',
                    _getScoreColor(stats.performanceScore),
                    Icons.stars,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInsightCard(
                    'Reliability',
                    '${stats.reliability.toStringAsFixed(1)}%',
                    Colors.blue,
                    Icons.check_circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildInsightCard(
                    'Consistency',
                    stats.consistency.toUpperCase(),
                    _getConsistencyColor(stats.consistency),
                    Icons.insights,
                  ),
                ),
              ],
            ),
            if (comparison != null && comparison.trend != 'insufficient_data') ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _getTrendColor(comparison.trend).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      _getTrendIcon(comparison.trend),
                      color: _getTrendColor(comparison.trend),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trend: ${comparison.trend.toUpperCase()}',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _getTrendColor(comparison.trend),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${comparison.percentChange >= 0 ? '+' : ''}${comparison.percentChange.toStringAsFixed(1)}% vs previous period',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (stats.anomalyCount > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      '${stats.anomalyCount} anomalies detected',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );
    });
  }

  Widget _buildInsightCard(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  Color _getConsistencyColor(String consistency) {
    switch (consistency.toLowerCase()) {
      case 'excellent':
        return Colors.green;
      case 'good':
        return Colors.blue;
      case 'fair':
        return Colors.orange;
      case 'poor':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getTrendColor(String trend) {
    switch (trend.toLowerCase()) {
      case 'improving':
        return Colors.green;
      case 'declining':
        return Colors.red;
      case 'stable':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getTrendIcon(String trend) {
    switch (trend.toLowerCase()) {
      case 'improving':
        return Icons.trending_up;
      case 'declining':
        return Icons.trending_down;
      case 'stable':
        return Icons.trending_flat;
      default:
        return Icons.remove;
    }
  }

  Widget _buildPerformanceCard(DeviceAnalyticsController controller, List<ChartDataPoint> data) {
    final selectedMetric = controller.metricTypes.firstWhere(
      (m) => m['value'] == controller.selectedMetricType.value,
      orElse: () => controller.metricTypes[0],
    );
    final color = Color(selectedMetric['color'] as int);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Performance',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D3748),
                    ),
                  ),
                  Text(
                    selectedMetric['label'] as String,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  controller.selectedPeriod.value.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: _buildPerformanceChart(data, color),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceChart(List<ChartDataPoint> data, Color color) {
    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: 1,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey[200]!,
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(
          show: true,
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: data.length > 12 ? (data.length / 6).ceil().toDouble() : 2.0,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index >= 0 && index < data.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      data[index].label,
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 45,
              getTitlesWidget: (value, meta) {
                return Text(
                  value >= 1000 ? '${(value / 1000).toStringAsFixed(1)}k' : value.toStringAsFixed(0),
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: data.asMap().entries.map((entry) {
              return FlSpot(entry.key.toDouble(), entry.value.value);
            }).toList(),
            isCurved: true,
            curveSmoothness: 0.4,
            color: color,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: Colors.white,
                  strokeWidth: 2,
                  strokeColor: color,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  color.withOpacity(0.3),
                  color.withOpacity(0.0),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsRow(List<ChartDataPoint> data) {
    return Obx(() {
      final controller = Get.find<DeviceAnalyticsController>();
      final analyticsData = controller.analyticsData.value;
      
      if (analyticsData?.summary == null) {
        final values = data.map((e) => e.value).toList();
        final max = values.isEmpty ? 0.0 : values.reduce((a, b) => a > b ? a : b);
        final avg = values.isEmpty ? 0.0 : values.reduce((a, b) => a + b) / values.length;
        final min = values.isEmpty ? 0.0 : values.reduce((a, b) => a < b ? a : b);
        
        return Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                'Maximum',
                max.toStringAsFixed(1),
                Icons.trending_up,
                Colors.green,
                'N/A',
                true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                'Average',
                avg.toStringAsFixed(1),
                Icons.show_chart,
                Colors.blue,
                'N/A',
                true,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                'Minimum',
                min.toStringAsFixed(1),
                Icons.trending_down,
                Colors.orange,
                'N/A',
                true,
              ),
            ),
          ],
        );
      }
      
      final stats = analyticsData!.summary!.getPeriodStats(controller.selectedPeriod.value);
      
      return Row(
        children: [
          Expanded(
            child: _buildMetricCard(
              'Maximum',
              stats.max.toStringAsFixed(1),
              Icons.trending_up,
              Colors.green,
              '${stats.percentChange >= 0 ? '+' : ''}${stats.percentChange.toStringAsFixed(1)}%',
              stats.percentChange >= 0,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildMetricCard(
              'Average',
              stats.average.toStringAsFixed(1),
              Icons.show_chart,
              Colors.blue,
              '${stats.percentChange >= 0 ? '+' : ''}${stats.percentChange.toStringAsFixed(1)}%',
              stats.percentChange >= 0,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildMetricCard(
              'Minimum',
              stats.min.toStringAsFixed(1),
              Icons.trending_down,
              Colors.orange,
              'σ: ${stats.standardDeviation.toStringAsFixed(1)}',
              true,
            ),
          ),
        ],
      );
    });
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color, String change, bool isPositive) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isPositive ? Colors.green.shade50 : Colors.red.shade50,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              change,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isPositive ? Colors.green : Colors.red,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDailyOverview(List<ChartDataPoint> data) {
    final values = data.map((e) => e.value).toList();
    final total = values.isEmpty ? 0.0 : values.reduce((a, b) => a + b);
    final avg = values.isEmpty ? 0.0 : total / values.length;
    final targetValue = avg * 1.2;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Daily Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildCircularMetric(
                  'Current',
                  avg.toStringAsFixed(0),
                  'Actual Value',
                  avg,
                  targetValue,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _buildCircularMetric(
                  'Target',
                  targetValue.toStringAsFixed(0),
                  'Expected',
                  targetValue,
                  targetValue,
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _buildCircularMetric(
                  'Points',
                  '${data.length}',
                  'Data Count',
                  data.length.toDouble(),
                  100,
                  Colors.teal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    final controller = Get.find<DeviceAnalyticsController>();
                    controller.exportAnalytics();
                  },
                  icon: const Icon(Icons.share, color: Colors.white, size: 18),
                  label: const Text(
                    'Export CSV',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade600,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    final controller = Get.find<DeviceAnalyticsController>();
                    controller.exportToPDF();
                  },
                  icon: const Icon(Icons.picture_as_pdf, color: Colors.white, size: 18),
                  label: const Text(
                    'View PDF',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade600,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCircularMetric(String label, String value, String subtitle, double current, double max, Color color) {
    final percentage = max > 0 ? (current / max) : 0.0;
    
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 90,
              height: 90,
              child: CircularProgressIndicator(
                value: percentage > 1 ? 1.0 : percentage,
                strokeWidth: 8,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Column(
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailedStats(DeviceAnalyticsController controller, List<ChartDataPoint> data) {
    final analyticsData = controller.analyticsData.value;
    
    double totalRunTimeHours = 0.0;
    double totalPowerUsed = 0.0;
    
    if (analyticsData != null) {
      final period = controller.selectedPeriod.value;
      final dataPointCount = data.length;
      
      if (period == 'hourly') {
        totalRunTimeHours = dataPointCount * 1.0;
      } else if (period == 'today') {
        totalRunTimeHours = dataPointCount * 1.0;
      } else if (period == 'weekly') {
        totalRunTimeHours = dataPointCount * 24.0;
      } else if (period == 'monthly') {
        totalRunTimeHours = dataPointCount * 24.0;
      } else if (period == 'yearly') {
        totalRunTimeHours = dataPointCount * 730.0;
      }
      
      List<ChartDataPoint> energyData;
      switch (period) {
        case 'hourly':
          energyData = analyticsData.hourly;
          break;
        case 'weekly':
          energyData = analyticsData.weekly;
          break;
        case 'monthly':
          energyData = analyticsData.monthly;
          break;
        case 'yearly':
          energyData = analyticsData.yearly;
          break;
        case 'today':
        default:
          energyData = analyticsData.today;
      }
      
      if (controller.selectedMetricType.value == 'energy_kwh') {
        totalPowerUsed = energyData.map((e) => e.value).fold(0.0, (a, b) => a + b);
      } else if (controller.selectedMetricType.value == 'power_kw') {
        final avgPower = energyData.map((e) => e.value).fold(0.0, (a, b) => a + b) / energyData.length;
        totalPowerUsed = avgPower * totalRunTimeHours;
      } else {
        totalPowerUsed = 0.0;
      }
    }
    
    String formatRunTime(double hours) {
      if (hours >= 24) {
        final days = (hours / 24).floor();
        final remainingHours = (hours % 24).floor();
        return remainingHours > 0 ? '${days}d ${remainingHours}h' : '${days}d';
      } else {
        return '${hours.toStringAsFixed(1)}h';
      }
    }
    
    String formatPower(double kwh) {
      if (kwh >= 1000) {
        return '${(kwh / 1000).toStringAsFixed(2)} MWh';
      } else {
        return '${kwh.toStringAsFixed(2)} kWh';
      }
    }

    final statsList = [
      {'label': 'Total Run Time', 'value': formatRunTime(totalRunTimeHours), 'percent': 100.0, 'color': Colors.green},
      {'label': 'Total Power Used', 'value': formatPower(totalPowerUsed), 'percent': totalPowerUsed > 0 ? 100.0 : 0.0, 'color': Colors.blue},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Detailed Statistics',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'View',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Device Usage Metrics',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 20),
          ...statsList.map((stat) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildStatRow(
              stat['label'] as String,
              stat['value'] as String,
              stat['percent'] as double,
              stat['color'] as Color,
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value, double percent, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2D3748),
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: percent > 100 ? 1.0 : percent / 100,
            minHeight: 8,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
