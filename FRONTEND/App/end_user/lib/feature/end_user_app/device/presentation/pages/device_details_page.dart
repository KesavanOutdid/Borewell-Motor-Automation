import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../../utils/widgets/swipe_button.dart';
import '../controllers/device_details_controller.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';
import '../../../../../utils/widgets/ui_components.dart';

class DeviceDetailsView extends GetView<DeviceDetailsController> {
  const DeviceDetailsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Obx(() {
          final nickname = controller.liveData['nickname']?.toString() ?? '-';
          final serial = controller.liveData['serialNumber']?.toString() ?? '-';
          final displayTitle = (nickname != '-' && nickname.isNotEmpty) ? nickname : serial;
          return Text(displayTitle, style: const TextStyle(fontWeight: FontWeight.bold));
        }),
        actions: [
          Obx(() {
            final isConnected = controller.isConnected.value;
            return Row(
              children: [
                Icon(
                  Icons.wifi_rounded,
                  size: 18,
                  color: isConnected ? AppColors.primaryGreen : Colors.grey,
                ),
                const SizedBox(width: 6),
                Text(
                  isConnected ? 'Connected' : 'Disconnected',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isConnected ? AppColors.primaryGreen : Colors.grey,
                  ),
                ),
                const SizedBox(width: 16),
              ],
            );
          }),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: controller.refreshData,
        child: Obx(() {
          if (controller.errorMessage.value.isNotEmpty) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.8,
                child: NetworkErrorWidget(
                  message: controller.errorMessage.value,
                  onRetry: () => controller.fetchDeviceDetails(),
                ),
              ),
            );
          }
          
          if (controller.isLoading.value && controller.liveData.isEmpty) {
            return _buildSkeleton();
          }
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Obx(() => _buildDevicePlacementCard(context, controller)),
                const SizedBox(height: 20),
                _buildQuickActionsRow(context, controller),
                const SizedBox(height: 24),
                Text(
                  'Live Readings',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),
                Obx(() => _buildLiveDataGrid(context, controller)),
                const SizedBox(height: 20),
                Obx(() => _buildLocationMapCard(controller)),
                const SizedBox(height: 20),
                _buildStatusControlCard(controller),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildSkeleton() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            const SizedBox(height: 24),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.5,
              ),
              itemCount: 4,
              itemBuilder: (context, index) => Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openHistory(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    final imei = controller.liveData['imei']?.toString();

    if (serial == null || serial.trim().isEmpty || imei == null || imei.trim().isEmpty) {
      if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
        Get.snackbar(
          'History',
          'Device information unavailable',
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 2),
        );
      }
      return;
    }

    Get.toNamed('/device/history', arguments: {
      'serial_number': serial,
      'imei_number': imei,
    });
  }

  void _openAnalytics(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    final imei = controller.liveData['imei']?.toString();

    if (serial == null || serial.trim().isEmpty || imei == null || imei.trim().isEmpty) {
      if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
        Get.snackbar(
          'Analytics',
          'Device information unavailable',
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 2),
        );
      }
      return;
    }

    Get.toNamed('/device/analytics', arguments: {
      'serial_number': serial,
      'imei_number': imei,
    });
  }

  void _openSharing(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    if (serial == null || serial.trim().isEmpty) {
       if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
         Get.snackbar('Error', 'Device information unavailable');
       }
       return;
    }
    Get.toNamed('/device/sharing', arguments: {
      'serial_number': serial,
    });
  }

  void _openSchedule(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    final imei = controller.liveData['imei']?.toString();

    if (serial == null || serial.trim().isEmpty || imei == null || imei.trim().isEmpty) {
      if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
        Get.snackbar('Error', 'Device information unavailable');
      }
      return;
    }

    Get.toNamed('/device/schedule', arguments: {
      'serial_number': serial,
      'imei_number': imei,
    });
  }

  void _showEditNicknameDialog(BuildContext context, DeviceDetailsController controller) {
    print('DEBUG: _showEditNicknameDialog called');
    final nickname = controller.liveData['nickname']?.toString() ?? '';
    final serial = controller.liveData['serialNumber']?.toString() ?? '-';
    final initialValue = (nickname != '-' && nickname.isNotEmpty) ? nickname : '';
    final textController = TextEditingController(text: initialValue);

    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Edit Device Name',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Serial $serial',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: textController,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Nickname',
                  hintText: 'e.g. Farm Motor 1',
                  prefixIcon: const Icon(Icons.label_outline_rounded),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                  ),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Cancel',
                        style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final newName = textController.text.trim();
                        if (newName.isNotEmpty) {
                          Navigator.of(context).pop();
                          controller.updateNickname(newName);
                        } else {
                          if (Get.context != null && Navigator.maybeOf(Get.context!)?.overlay != null) {
                            Get.snackbar(
                              'Error',
                              'Please enter a name',
                              snackPosition: SnackPosition.BOTTOM,
                              backgroundColor: Colors.red[100],
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Save Name',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionsRow(BuildContext context, DeviceDetailsController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _QuickActionCard(
              icon: Icons.history_rounded,
              label: 'History',
              gradient: AppColors.primaryGradient,
              onTap: () => _openHistory(controller),
            ),
          ),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.analytics_rounded,
              label: 'Analytics',
              gradient: AppColors.primaryGradient,
              onTap: () => _openAnalytics(controller),
            ),
          ),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.share_rounded,
              label: 'Share',
              gradient: AppColors.primaryGradient,
              onTap: () => _openSharing(controller),
            ),
          ),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.timer_rounded,
              label: 'Schedule',
              gradient: AppColors.primaryGradient,
              onTap: () => _openSchedule(controller),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDevicePlacementCard(BuildContext context, DeviceDetailsController controller) {
    final nickname = controller.liveData['nickname']?.toString() ?? '';
    final serial = controller.liveData['serialNumber']?.toString() ?? '-';
    final location = controller.liveData['location'] ?? 'Location not set';
    final imei = controller.liveData['imei'] ?? 'N/A';
    
    final bool hasNickname = nickname.isNotEmpty && nickname != '-';
    
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.settings_input_component_rounded, size: 28, color: AppColors.primaryGreen),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            hasNickname ? nickname : serial,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Obx(() {
                          final isConnected = controller.isConnected.value;
                          return Icon(
                            Icons.wifi_rounded,
                            size: 18,
                            color: isConnected ? AppColors.primaryGreen : Colors.grey.shade400,
                          );
                        }),
                      ],
                    ),
                    if (hasNickname)
                      Text(
                        'Serial $serial',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade600,
                        ),
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _showEditNicknameDialog(context, controller),
                icon: const Icon(Icons.edit_outlined, color: AppColors.primaryGreen, size: 22),
                tooltip: 'Edit Device Name',
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.location_on_rounded, size: 24, color: Colors.blue),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  location,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, size: 24, color: Colors.orange),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'IMEI $imei',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusControlCard(DeviceDetailsController controller) {
    return Obx(() {
      final isRunning = controller.liveData['motorStatus'] == 'Running';
      final isConnected = controller.isConnected.value;
      final statusColor = isRunning ? AppColors.error : AppColors.primaryGreen;
      
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Motor Control',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (controller.isProcessing.value)
                          const SizedBox(
                            width: 10,
                            height: 10,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                          )
                        else
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                        const SizedBox(width: 8),
                        Text(
                          controller.isProcessing.value ? 'CONFIRMING...' : (isRunning ? 'MOTOR RUNNING' : 'MOTOR STOPPED'),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: controller.isProcessing.value ? AppColors.primaryGreen : statusColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    if (controller.isPoorSignal)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, size: 12, color: Colors.orange),
                            const SizedBox(width: 4),
                            Text(
                              'Poor Signal: Commands may be delayed',
                              style: TextStyle(fontSize: 10, color: Colors.orange.shade800, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            SwipeButton(
              onSwipe: () {
                if (isRunning) {
                  controller.stopMotor();
                } else {
                  controller.startMotor();
                }
              },
              label: controller.isProcessing.value ? 'Waiting for confirmation...' : (isRunning ? 'Swipe Left to Stop' : 'Swipe to Start'),
              icon: isRunning ? Icons.arrow_back_rounded : Icons.play_arrow_rounded,
              activeColor: isRunning ? AppColors.error : AppColors.primaryGreen,
              isEnabled: isConnected && !controller.isProcessing.value,
              direction: isRunning ? SwipeDirection.left : SwipeDirection.right,
            ),
            const SizedBox(height: 20),
            _buildInfoRow('Device Status', controller.liveData['deviceStatus'] ?? 'Ready'),
          ],
        ),
      );
    });
  }

  Widget _buildLocationMapCard(DeviceDetailsController controller) {
    final latitude = controller.liveData['latitude'] ?? 28.6139;
    final longitude = controller.liveData['longitude'] ?? 77.2090;
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on_rounded, color: AppColors.primaryGreen, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Device Location',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  controller.liveData['location']?.toString() ?? 'Location not available',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
            child: SizedBox(
              height: 200,
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng(latitude, longitude),
                  zoom: 14,
                ),
                gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                  Factory<OneSequenceGestureRecognizer>(
                    () => EagerGestureRecognizer(),
                  ),
                },
                markers: {
                  Marker(
                    markerId: const MarkerId('device_location'),
                    position: LatLng(latitude, longitude),
                    infoWindow: InfoWindow(
                      title: 'Device Location',
                      snippet: controller.liveData['location'] ?? 'Unknown',
                    ),
                  ),
                },
                zoomControlsEnabled: false,
                myLocationButtonEnabled: false,
                mapToolbarEnabled: false,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, dynamic value) {
    final displayValue = value == null || value.toString().isEmpty
        ? '-'
        : value.toString();
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Get.isDarkMode ? Colors.grey[400] : Colors.grey[600],
          ),
        ),
        Flexible(
          child: Text(
            displayValue,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Get.isDarkMode ? Colors.white : Colors.black87,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildLiveDataGrid(
      BuildContext context, DeviceDetailsController controller) {
    final metrics = [
      {
        'label': 'Motor Frequency',
        'value': controller.liveData['motorFrequency'] ?? '-',
        'icon': Icons.multiline_chart,
        'gradient': AppColors.purpleGradient,
      },
      {
        'label': 'Motor Energy',
        'value': controller.liveData['motorEnergy'] ?? '-',
        'icon': Icons.electric_bolt,
        'gradient': AppColors.sunsetGradient,
      },
      {
        'label': 'Motor Speed',
        'value': controller.liveData['motorSpeed'] ?? '-',
        'icon': Icons.speed,
        'gradient': AppColors.purpleGradient,
      },
      {
        'label': 'Device Temperature',
        'value': controller.liveData['deviceTemperature'] ?? '-',
        'icon': Icons.thermostat,
        'gradient': AppColors.sunsetGradient,
      },
      {
        'label': 'Motor Power',
        'value': controller.liveData['motorPower'] ?? '-',
        'icon': Icons.power,
        'gradient': AppColors.primaryGradient,
      },
      {
        'label': 'Flow Rate',
        'value': controller.liveData['flowRate'] ?? '-',
        'icon': Icons.water_drop,
        'gradient': AppColors.blueGradient,
      },
      {
        'label': 'Alert',
        'value': controller.liveData['alert'] == '-' ? 'No Alert' : (controller.liveData['alert'] ?? 'No Alert'),
        'icon': Icons.warning_amber,
        'gradient': const LinearGradient(
          colors: [Color(0xFFFF4757), Color(0xFFFF6B9D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
      {
        'label': 'Signal Strength',
        'value': controller.liveData['signalStrength'] ?? '-',
        'icon': Icons.signal_cellular_alt,
        'gradient': AppColors.primaryGradient,
      },
    ];

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard(metrics[0])),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[1])),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[6])),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildMetricCard(metrics[3])),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[4])),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[5])),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildMetricCard(metrics[2])),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[7])),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard(Map<String, dynamic> metric) {
    return MetricCard(
      label: metric['label'] as String,
      value: '${metric['value']}',
      icon: metric['icon'] as IconData,
      gradient: metric['gradient'] as Gradient,
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Gradient gradient;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: gradient,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[300] : Colors.grey[700],
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
