import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/home_controller.dart';
import '../../../../../core/services/notification_storage_service.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../shop/presentation/controllers/voucher_controller.dart';
import 'dart:math';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  final ScrollController _voucherScrollController = ScrollController();
  Timer? _autoScrollTimer;
  final Random _random = Random();
  late HomeController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.find<HomeController>();
    _startAutoScroll();
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _voucherScrollController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_voucherScrollController.hasClients) {
        final maxScroll = _voucherScrollController.position.maxScrollExtent;
        final currentScroll = _voucherScrollController.offset;
        
        if (currentScroll >= maxScroll) {
          _voucherScrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeInOut,
          );
        } else {
          _voucherScrollController.animateTo(
            currentScroll + 210,
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationStorage = NotificationStorageService();
    final voucherController = Get.find<VoucherController>();
    
    return Scaffold(
      body: Column(
        children: [
          Container(
            width: double.infinity,
            height: 110,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF16A34A), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'My Devices',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  StreamBuilder<int>(
                    stream: Stream.periodic(const Duration(seconds: 1), (_) {
                      return notificationStorage.getUnreadCount();
                    }),
                    builder: (context, snapshot) {
                      final unreadCount = snapshot.data ?? notificationStorage.getUnreadCount();
                      return Stack(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.notifications_outlined,
                              color: Colors.white,
                              size: 28,
                            ),
                            onPressed: () => Get.toNamed('/notifications'),
                          ),
                          if (unreadCount > 0)
                            Positioned(
                              right: 8,
                              top: 8,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 16,
                                  minHeight: 16,
                                ),
                                child: Text(
                                  unreadCount > 99 ? '99+' : unreadCount.toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          Obx(() {
            if (voucherController.vouchers.isNotEmpty) {
              return Container(
                height: 105,
                margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                child: ListView.builder(
                  controller: _voucherScrollController,
                  scrollDirection: Axis.horizontal,
                  itemCount: voucherController.vouchers.length,
                  itemBuilder: (context, index) {
                    final voucher = voucherController.vouchers[index];
                    return _buildCompactVoucherCard(voucher, index);
                  },
                ),
              );
            }
            return const SizedBox.shrink();
          }),
            Expanded(
              child: Obx(() {
                if (controller.isLoading.value) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (controller.devices.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primaryGreen.withOpacity(0.1),
                                AppColors.emerald.withOpacity(0.05),
                              ],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.devices_other,
                            size: 64,
                            color: AppColors.primaryGreen.withOpacity(0.5),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'No devices assigned',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.titleLarge?.color,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Contact admin to assign devices',
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(context).textTheme.bodyMedium?.color,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                final runningDevices = controller.devices.where((device) {
                  return _isDeviceConfigured(device) && _isDeviceRunning(device);
                }).toList();

                final stoppedDevices = controller.devices.where((device) {
                  return _isDeviceConfigured(device) && !_isDeviceRunning(device);
                }).toList();

                final notConfiguredDevices = controller.devices.where((device) {
                  return !_isDeviceConfigured(device);
                }).toList();

                return RefreshIndicator(
                  onRefresh: () => controller.fetchDevices(),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),
                        
                        if (runningDevices.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Running Devices',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${runningDevices.length}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: runningDevices.length,
                              itemBuilder: (context, index) {
                                final device = runningDevices[index];
                                return _buildDeviceCard(device, true, true);
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        if (stoppedDevices.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Stopped Devices',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${stoppedDevices.length}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: stoppedDevices.length,
                              itemBuilder: (context, index) {
                                final device = stoppedDevices[index];
                                return _buildDeviceCard(device, true, false);
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        if (notConfiguredDevices.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Not Configured',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  '${notConfiguredDevices.length}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: notConfiguredDevices.length,
                              itemBuilder: (context, index) {
                                final device = notConfiguredDevices[index];
                                return _buildDeviceCard(device, false, false);
                              },
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'home_add_device_fab',
        onPressed: () => controller.showAddDeviceDialog(),
        backgroundColor: AppColors.primaryGreen,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('ADD'),
      ),
    );
  }

  Widget _buildDeviceCard(Map<String, dynamic> device, bool isConfigured, bool isRunning) {
    final deviceStatus = !isConfigured 
        ? 'Not Configured' 
        : (isRunning ? 'Running' : 'Stopped');
    
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [AppColors.cardShadow],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _navigateDevice(device),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  height: 70,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: !isConfigured
                          ? [Colors.orange.shade300, Colors.orange.shade400]
                          : (isRunning 
                              ? [AppColors.primaryGreen, AppColors.emerald]
                              : [Colors.grey.shade300, Colors.grey.shade400]),
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    !isConfigured ? Icons.settings : Icons.water_drop,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 8),
                Builder(
                  builder: (context) => Text(
                    device['serial_number'] ?? 'Motor Unit',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (device['location'] != null && device['location'].toString().trim().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Builder(
                      builder: (context) => Text(
                        device['location'],
                        style: TextStyle(
                          fontSize: 9,
                          color: Theme.of(context).textTheme.bodySmall?.color ?? AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                const Spacer(),
                Row(
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: !isConfigured
                            ? Colors.orange
                            : (isRunning ? AppColors.primaryGreen : Colors.grey),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Builder(
                        builder: (context) => Text(
                          deviceStatus,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: !isConfigured
                                ? Colors.orange.shade800
                                : (isRunning ? AppColors.darkGreen : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade700)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool _isDeviceConfigured(Map<String, dynamic> device) {
    final imei = device['imei_number'] ?? device['imeiNumber'];
    if (imei == null) return false;
    return imei.toString().trim().isNotEmpty;
  }

  bool _isDeviceRunning(Map<String, dynamic> device) {
    final status = device['start_status'] ?? device['startStatus'] ?? device['status'] ?? device['device_status'];
    if (status is bool) {
      return status;
    }
    if (status is String) {
      final normalized = status.toLowerCase();
      return normalized == 'running' || normalized == 'on' || normalized == 'true';
    }
    return false;
  }

  void _navigateDevice(Map<String, dynamic> device) async {
    final route = _isDeviceConfigured(device)
        ? '/device/details'
        : '/device/configure';
    await Get.toNamed(route, arguments: device);
    controller.fetchDevices();
  }

  Widget _buildCompactVoucherCard(voucher, int index) {
    final colors = [
      [const Color(0xFFFF6B6B), const Color(0xFFFF8E53)],
      [const Color(0xFF4FACFE), const Color(0xFF00F2FE)],
      [const Color(0xFF43E97B), const Color(0xFF38F9D7)],
      [const Color(0xFFFA709A), const Color(0xFFFEE140)],
      [const Color(0xFF8E2DE2), const Color(0xFF4A00E0)],
      [const Color(0xFFFF512F), const Color(0xFFDD2476)],
      [const Color(0xFF11998E), const Color(0xFF38EF7D)],
      [const Color(0xFFFC466B), const Color(0xFF3F5EFB)],
    ];
    
    final colorPair = colors[(voucher.voucherCode.hashCode + index) % colors.length];
    
    final widths = [190.0, 210.0, 200.0, 215.0, 195.0];
    final width = widths[index % widths.length];
    
    final heights = [95.0, 100.0, 98.0];
    final height = heights[index % heights.length];
    
    return Container(
      width: width,
      height: height,
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colorPair,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: colorPair[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${voucher.discountPercentage}% OFF',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    voucher.voucherCode,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.local_offer,
                color: colorPair[0],
                size: 24,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
