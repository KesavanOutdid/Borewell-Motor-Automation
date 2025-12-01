class AnalyticsData {
  final List<ChartDataPoint> hourly;
  final List<ChartDataPoint> today;
  final List<ChartDataPoint> weekly;
  final List<ChartDataPoint> monthly;
  final List<ChartDataPoint> yearly;
  final AnalyticsSummary? summary;
  final AnalyticsComparisons? comparisons;
  final OverallStats? overallStats;

  AnalyticsData({
    required this.hourly,
    required this.today,
    required this.weekly,
    required this.monthly,
    required this.yearly,
    this.summary,
    this.comparisons,
    this.overallStats,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    return AnalyticsData(
      hourly: (json['hourly'] as List<dynamic>?)
              ?.map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      today: (json['today'] as List<dynamic>?)
              ?.map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      weekly: (json['weekly'] as List<dynamic>?)
              ?.map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      monthly: (json['monthly'] as List<dynamic>?)
              ?.map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      yearly: (json['yearly'] as List<dynamic>?)
              ?.map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      summary: json['summary'] != null 
          ? AnalyticsSummary.fromJson(json['summary'] as Map<String, dynamic>)
          : null,
      comparisons: json['comparisons'] != null
          ? AnalyticsComparisons.fromJson(json['comparisons'] as Map<String, dynamic>)
          : null,
      overallStats: json['overallStats'] != null
          ? OverallStats.fromJson(json['overallStats'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ChartDataPoint {
  final String label;
  final double value;
  final DateTime? timestamp;

  ChartDataPoint({
    required this.label,
    required this.value,
    this.timestamp,
  });

  factory ChartDataPoint.fromJson(Map<String, dynamic> json) {
    return ChartDataPoint(
      label: (json['label'] ?? json['time'])?.toString() ?? '',
      value: (json['value'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString())
          : null,
    );
  }
}

class PeriodStats {
  final int dataPoints;
  final int totalRecords;
  final double average;
  final double min;
  final double max;
  final String trend;
  final double percentChange;
  final double standardDeviation;
  final int performanceScore;
  final int anomalyCount;
  final String consistency;
  final double reliability;
  final PeakPoint? peakHour;
  final PeakPoint? lowestHour;

  PeriodStats({
    required this.dataPoints,
    required this.totalRecords,
    required this.average,
    required this.min,
    required this.max,
    required this.trend,
    required this.percentChange,
    required this.standardDeviation,
    required this.performanceScore,
    required this.anomalyCount,
    required this.consistency,
    required this.reliability,
    this.peakHour,
    this.lowestHour,
  });

  factory PeriodStats.fromJson(Map<String, dynamic> json) {
    return PeriodStats(
      dataPoints: (json['dataPoints'] as num?)?.toInt() ?? 0,
      totalRecords: (json['totalRecords'] as num?)?.toInt() ?? 0,
      average: (json['average'] as num?)?.toDouble() ?? 0.0,
      min: (json['min'] as num?)?.toDouble() ?? 0.0,
      max: (json['max'] as num?)?.toDouble() ?? 0.0,
      trend: json['trend']?.toString() ?? 'no_data',
      percentChange: (json['percentChange'] as num?)?.toDouble() ?? 0.0,
      standardDeviation: (json['standardDeviation'] as num?)?.toDouble() ?? 0.0,
      performanceScore: (json['performanceScore'] as num?)?.toInt() ?? 0,
      anomalyCount: (json['anomalyCount'] as num?)?.toInt() ?? 0,
      consistency: json['consistency']?.toString() ?? 'no_data',
      reliability: (json['reliability'] as num?)?.toDouble() ?? 0.0,
      peakHour: json['peakHour'] != null 
          ? PeakPoint.fromJson(json['peakHour'] as Map<String, dynamic>)
          : null,
      lowestHour: json['lowestHour'] != null
          ? PeakPoint.fromJson(json['lowestHour'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PeakPoint {
  final String label;
  final double value;
  final DateTime? timestamp;

  PeakPoint({
    required this.label,
    required this.value,
    this.timestamp,
  });

  factory PeakPoint.fromJson(Map<String, dynamic> json) {
    return PeakPoint(
      label: json['label']?.toString() ?? '',
      value: (json['value'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString())
          : null,
    );
  }
}

class AnalyticsSummary {
  final PeriodStats hourly;
  final PeriodStats today;
  final PeriodStats weekly;
  final PeriodStats monthly;
  final PeriodStats yearly;

  AnalyticsSummary({
    required this.hourly,
    required this.today,
    required this.weekly,
    required this.monthly,
    required this.yearly,
  });

  factory AnalyticsSummary.fromJson(Map<String, dynamic> json) {
    return AnalyticsSummary(
      hourly: PeriodStats.fromJson(json['hourly'] as Map<String, dynamic>? ?? {}),
      today: PeriodStats.fromJson(json['today'] as Map<String, dynamic>? ?? {}),
      weekly: PeriodStats.fromJson(json['weekly'] as Map<String, dynamic>? ?? {}),
      monthly: PeriodStats.fromJson(json['monthly'] as Map<String, dynamic>? ?? {}),
      yearly: PeriodStats.fromJson(json['yearly'] as Map<String, dynamic>? ?? {}),
    );
  }

  PeriodStats getPeriodStats(String period) {
    switch (period) {
      case 'hourly':
        return hourly;
      case 'weekly':
        return weekly;
      case 'monthly':
        return monthly;
      case 'yearly':
        return yearly;
      case 'today':
      default:
        return today;
    }
  }
}

class ComparisonData {
  final String label;
  final double previousAverage;
  final double currentAverage;
  final double absoluteChange;
  final double percentChange;
  final String trend;

  ComparisonData({
    required this.label,
    required this.previousAverage,
    required this.currentAverage,
    required this.absoluteChange,
    required this.percentChange,
    required this.trend,
  });

  factory ComparisonData.fromJson(Map<String, dynamic> json) {
    if (json['comparison'] == 'insufficient_data') {
      return ComparisonData(
        label: 'Insufficient Data',
        previousAverage: 0,
        currentAverage: 0,
        absoluteChange: 0,
        percentChange: 0,
        trend: 'insufficient_data',
      );
    }
    
    return ComparisonData(
      label: json['label']?.toString() ?? '',
      previousAverage: (json['previousAverage'] as num?)?.toDouble() ?? 0.0,
      currentAverage: (json['currentAverage'] as num?)?.toDouble() ?? 0.0,
      absoluteChange: (json['absoluteChange'] as num?)?.toDouble() ?? 0.0,
      percentChange: (json['percentChange'] as num?)?.toDouble() ?? 0.0,
      trend: json['trend']?.toString() ?? 'stable',
    );
  }
}

class AnalyticsComparisons {
  final ComparisonData hourly;
  final ComparisonData today;
  final ComparisonData weekly;
  final ComparisonData monthly;

  AnalyticsComparisons({
    required this.hourly,
    required this.today,
    required this.weekly,
    required this.monthly,
  });

  factory AnalyticsComparisons.fromJson(Map<String, dynamic> json) {
    return AnalyticsComparisons(
      hourly: ComparisonData.fromJson(json['hourly'] as Map<String, dynamic>? ?? {}),
      today: ComparisonData.fromJson(json['today'] as Map<String, dynamic>? ?? {}),
      weekly: ComparisonData.fromJson(json['weekly'] as Map<String, dynamic>? ?? {}),
      monthly: ComparisonData.fromJson(json['monthly'] as Map<String, dynamic>? ?? {}),
    );
  }

  ComparisonData getComparison(String period) {
    switch (period) {
      case 'hourly':
        return hourly;
      case 'weekly':
        return weekly;
      case 'monthly':
        return monthly;
      case 'today':
      default:
        return today;
    }
  }
}

class OverallStats {
  final int totalDataPoints;
  final int averagePerformance;
  final String overallTrend;
  final int totalAnomalies;

  OverallStats({
    required this.totalDataPoints,
    required this.averagePerformance,
    required this.overallTrend,
    required this.totalAnomalies,
  });

  factory OverallStats.fromJson(Map<String, dynamic> json) {
    return OverallStats(
      totalDataPoints: (json['totalDataPoints'] as num?)?.toInt() ?? 0,
      averagePerformance: (json['averagePerformance'] as num?)?.toInt() ?? 0,
      overallTrend: json['overallTrend']?.toString() ?? 'stable',
      totalAnomalies: (json['totalAnomalies'] as num?)?.toInt() ?? 0,
    );
  }
}
