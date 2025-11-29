import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/home_controller.dart';
import '../../../../../core/services/notification_storage_service.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final notificationStorage = NotificationStorageService();
    
    return Scaffold(
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
                Icon(Icons.devices_other, size: 80, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'No devices assigned',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Contact admin to assign devices',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
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
              
              return InkWell(
                onTap: () => _navigateDevice(device),
                child: Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 1,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: !isConfigured 
                                ? Colors.orange 
                                : (isRunning ? Colors.green : Colors.blue),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            !isConfigured ? Icons.settings : Icons.bolt,
                            color: Colors.white,
                            size: 28,
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
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: !isConfigured
                                          ? Colors.orange
                                          : (isRunning ? Colors.green : Colors.grey),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    deviceStatus,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: Colors.grey[400],
                          size: 28,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      }),
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
