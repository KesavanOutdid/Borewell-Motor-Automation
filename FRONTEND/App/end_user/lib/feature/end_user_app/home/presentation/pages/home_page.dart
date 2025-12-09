import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/home_controller.dart';
import '../../../../../core/services/notification_storage_service.dart';
import '../../../../../utils/theme/app_colors.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final notificationStorage = NotificationStorageService();
    
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('My Devices'),
        actions: [
          StreamBuilder<int>(
            stream: Stream.periodic(const Duration(seconds: 1), (_) {
              return notificationStorage.getUnreadCount();
            }),
            builder: (context, snapshot) {
              final unreadCount = snapshot.data ?? notificationStorage.getUnreadCount();
              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications),
                    onPressed: () => Get.toNamed('/notifications'),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        child: Text(
                          unreadCount > 99 ? '99+' : unreadCount.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
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
      body: Obx(() {
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
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Contact admin to assign devices',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => controller.fetchDevices(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: controller.devices.length,
            itemBuilder: (context, index) {
              final device = controller.devices[index];
              final isConfigured = _isDeviceConfigured(device);
              final isRunning = _isDeviceRunning(device);
              final deviceStatus = !isConfigured 
                  ? 'Not Configured' 
                  : (isRunning ? 'Running' : 'Not Running');
              
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [AppColors.cardShadow],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _navigateDevice(device),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: !isConfigured
                                  ? Colors.orange.shade400
                                  : (isRunning ? AppColors.primaryGreen : Colors.grey.shade400),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              !isConfigured ? Icons.settings : Icons.bolt,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                          const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                device['serial_number'] ?? 'Main Motor Unit',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: !isConfigured
                                      ? Colors.orange.shade100
                                      : (isRunning
                                          ? AppColors.primaryGreen.withOpacity(0.15)
                                          : Colors.grey.shade200),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: BoxDecoration(
                                        color: !isConfigured
                                            ? Colors.orange
                                            : (isRunning ? AppColors.primaryGreen : Colors.grey),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      deviceStatus,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: !isConfigured
                                            ? Colors.orange.shade800
                                            : (isRunning ? AppColors.darkGreen : Colors.grey.shade700),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (device['location'] != null && device['location'].toString().trim().isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.location_on,
                                        size: 14,
                                        color: AppColors.primaryGreen,
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          device['location'],
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: AppColors.textSecondary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.arrow_forward_ios,
                            color: AppColors.primaryGreen,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ),
                ),
              );
            },
          ),
        );
      }),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => controller.showAddDeviceDialog(),
        backgroundColor: AppColors.primaryGreen,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan QR'),
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
}
