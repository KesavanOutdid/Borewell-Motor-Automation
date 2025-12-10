import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../controllers/voucher_controller.dart';

class VouchersPage extends StatelessWidget {
  const VouchersPage({super.key});

  final List<List<Color>> voucherGradients = const [
    [Color(0xFF16A34A), Color(0xFF10B981)],
    [Color(0xFF2563EB), Color(0xFF3B82F6)],
    [Color(0xFFDC2626), Color(0xFFEF4444)],
    [Color(0xFFEA580C), Color(0xFFF97316)],
    [Color(0xFF9333EA), Color(0xFFA855F7)],
    [Color(0xFF0891B2), Color(0xFF06B6D4)],
  ];

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(VoucherController());

    return Scaffold(
      body: Column(
        children: [
          Container(
            width: double.infinity,
            height: 110,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            child: SafeArea(
              bottom: false,
              child: Align(
                alignment: Alignment.centerLeft,
                child: const Text(
                  'Available Vouchers',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value && controller.vouchers.isEmpty) {
                return const Center(child: CircularProgressIndicator());
              }

              if (controller.vouchers.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.local_offer_outlined,
                        size: 100,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? Colors.grey.shade700
                            : Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No vouchers available',
                        style: TextStyle(
                          fontSize: 18,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.grey.shade400
                              : Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Check back later for exciting offers',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.grey.shade500
                              : Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: controller.fetchVouchers,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.vouchers.length,
                  itemBuilder: (context, index) {
                    final voucher = controller.vouchers[index];
                    return _buildVoucherCard(context, voucher, index);
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  void _copyVoucherCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    Get.snackbar(
      'Copied!',
      'Voucher code copied to clipboard',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: AppColors.success,
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
      margin: const EdgeInsets.all(16),
    );
  }

  Widget _buildVoucherCard(BuildContext context, dynamic voucher, int index) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final gradientColors = voucherGradients[index % voucherGradients.length];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.3),
                              width: 1.2,
                            ),
                          ),
                          child: Text(
                            voucher.voucherCode,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        InkWell(
                          onTap: () => _copyVoucherCode(voucher.voucherCode),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(
                              Icons.copy,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${voucher.discountPercentage.toStringAsFixed(0)}%\nOFF',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: gradientColors[0],
                        height: 1.1,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (voucher.description.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    voucher.description,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 12,
                    color: Colors.white.withOpacity(0.9),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    'Valid till ${dateFormat.format(voucher.endDate.toLocal())}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
              if (voucher.maxUsage != null && voucher.maxUsage > 0) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Icons.people,
                      size: 12,
                      color: Colors.white.withOpacity(0.9),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Used ${voucher.usedCount} of ${voucher.maxUsage} times',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
