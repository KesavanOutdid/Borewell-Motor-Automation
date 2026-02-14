class VoucherModel {
  final String id;
  final String voucherCode;
  final int discountPercentage;
  final DateTime startDate;
  final DateTime endDate;
  final bool status;
  final int usedCount;
  final int maxUsage;
  final String description;

  VoucherModel({
    required this.id,
    required this.voucherCode,
    required this.discountPercentage,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.usedCount,
    required this.maxUsage,
    this.description = '',
  });

  factory VoucherModel.fromJson(Map<String, dynamic> json) {
    return VoucherModel(
      id: json['_id'] ?? '',
      voucherCode: json['voucher_code'] ?? '',
      discountPercentage: json['discount_percentage'] ?? 0,
      startDate: json['start_date'] != null ? DateTime.parse(json['start_date']) : DateTime.now(),
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : DateTime.now(),
      status: json['status'] ?? false,
      usedCount: json['used_count'] ?? 0,
      maxUsage: json['max_usage'] ?? 0,
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'voucher_code': voucherCode,
      'discount_percentage': discountPercentage,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
      'status': status,
      'used_count': usedCount,
      'max_usage': maxUsage,
      'description': description,
    };
  }

  bool get isActive => status && DateTime.now().isBefore(endDate) && DateTime.now().isAfter(startDate);
  bool get isExpired => DateTime.now().isAfter(endDate);
  bool get isMaxedOut => usedCount >= maxUsage;
}

class VoucherPagination {
  final int currentPage;
  final int totalPages;
  final int totalVouchers;
  final int totalActiveVouchers;
  final int totalInactiveVouchers;

  VoucherPagination({
    required this.currentPage,
    required this.totalPages,
    required this.totalVouchers,
    required this.totalActiveVouchers,
    required this.totalInactiveVouchers,
  });

  factory VoucherPagination.fromJson(Map<String, dynamic> json) {
    return VoucherPagination(
      currentPage: json['currentPage'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      totalVouchers: json['totalVouchers'] ?? 0,
      totalActiveVouchers: json['totalActiveVouchers'] ?? 0,
      totalInactiveVouchers: json['totalInactiveVouchers'] ?? 0,
    );
  }
}

class ValidatedVoucher {
  final String voucherCode;
  final int discountPercentage;
  final DateTime validUntil;
  final String description;

  ValidatedVoucher({
    required this.voucherCode,
    required this.discountPercentage,
    required this.validUntil,
    required this.description,
  });

  factory ValidatedVoucher.fromJson(Map<String, dynamic> json) {
    return ValidatedVoucher(
      voucherCode: json['voucher_code'] ?? '',
      discountPercentage: json['discount_percentage'] ?? 0,
      validUntil: json['valid_until'] != null ? DateTime.parse(json['valid_until']) : DateTime.now(),
      description: json['description'] ?? '',
    );
  }
}
