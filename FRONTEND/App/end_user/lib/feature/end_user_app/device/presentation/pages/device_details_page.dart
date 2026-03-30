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
  const DeviceDetailsView({super.key});

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
                SizedBox(height: 12),
                Obx(() {
                  final lastStart = controller.liveData['lastStart']?.toString() ?? '-';
                  final lastStop = controller.liveData['lastStop']?.toString() ?? '-';
                  if (lastStart == '-' && lastStop == '-') return const SizedBox.shrink();
                  return Row(
                    children: [
                      Expanded(
                        child: _TimeChip(
                          icon: Icons.play_circle_rounded,
                          label: 'Last Start',
                          value: lastStart,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: _TimeChip(
                          icon: Icons.stop_circle_rounded,
                          label: 'Last Stop',
                          value: lastStop,
                          color: AppColors.error,
                        ),
                      ),
                    ],
                  );
                }),
                SizedBox(height: 20),
                _buildQuickActionsRow(context, controller),
                SizedBox(height: 24),
                Obx(() => Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.sensors_rounded, size: 18, color: AppColors.primaryGreen),
                    ),
                    SizedBox(width: 12),
                    Text(
                      'Live Readings',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: controller.isConnected.value
                            ? AppColors.primaryGreen.withOpacity(0.1)
                            : Colors.grey.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: controller.isConnected.value ? AppColors.primaryGreen : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          SizedBox(width: 4),
                          Text(
                            controller.isConnected.value ? 'LIVE' : 'CACHED',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: controller.isConnected.value ? AppColors.primaryGreen : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                )),
                SizedBox(height: 16),
                Obx(() => _buildLiveDataGrid(context, controller)),
                SizedBox(height: 20),
                Obx(() => _buildLocationMapCard(controller)),
                SizedBox(height: 20),
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
            SizedBox(height: 20),
            Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            SizedBox(height: 24),
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
      return;
    }

    Get.toNamed('/device/analytics', arguments: {
      'serial_number': serial,
      'imei_number': imei,
    });
  }

  void _openAccess(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    if (serial == null || serial.trim().isEmpty) {
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
              Text(
                'Edit Device Name',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Serial $serial',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 24),
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
              SizedBox(height: 32),
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
                      child: Text('cancel'.tr,
                        style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final newName = textController.text.trim();
                        if (newName.isNotEmpty) {
                          Navigator.of(context).pop();
                          controller.updateNickname(newName);
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
                      child: Text(
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
              gradient: AppColors.blueGradient,
              onTap: () => _openHistory(controller),
            ),
          ),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.analytics_rounded,
              label: 'Analytics',
              gradient: AppColors.purpleGradient,
              onTap: () => _openAnalytics(controller),
            ),
          ),
          Obx(() {
            final isMaster = controller.liveData['role'] == 'master';
            if (!isMaster) return const SizedBox.shrink();
            
            return Expanded(
              child: _QuickActionCard(
                icon: Icons.group_add_rounded,
                label: 'access'.tr,
                gradient: AppColors.sunsetGradient,
                onTap: () => _openAccess(controller),
              ),
            );
          }),
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
    final isRunning = controller.liveData['motorStatus'] == 'Running';
    final isOnline = controller.isConnected.value;
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              gradient: isRunning
                  ? const LinearGradient(colors: [Color(0xFF059669), Color(0xFF10B981)])
                  : (isOnline
                      ? const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF60A5FA)])
                      : const LinearGradient(colors: [Color(0xFF6B7280), Color(0xFF9CA3AF)])),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.white.withOpacity(0.5), blurRadius: 6),
                    ],
                  ),
                ),
                SizedBox(width: 10),
                Text(
                  isRunning ? 'MOTOR RUNNING' : (isOnline ? 'DEVICE ONLINE' : 'DEVICE OFFLINE'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
                const Spacer(),
                Text(
                  controller.liveData['lastUpdate']?.toString() ?? '',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          // Card content
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.settings_input_component_rounded, size: 28, color: AppColors.primaryGreen),
                    ),
                    SizedBox(width: 16),
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
                    Obx(() {
                      final isMaster = controller.liveData['role'] == 'master';
                      if (!isMaster) return const SizedBox.shrink();
                      
                      return IconButton(
                        onPressed: () => _showEditNicknameDialog(context, controller),
                        icon: const Icon(Icons.edit_outlined, color: AppColors.primaryGreen, size: 22),
                        tooltip: 'Edit Device Name',
                      );
                    }),
                  ],
                ),
                SizedBox(height: 24),
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, size: 24, color: Colors.blue),
                    SizedBox(width: 16),
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
              ],
            ),
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
                    SizedBox(height: 4),
                    Row(
                      children: [
                        if (controller.isProcessing.value)
                          SizedBox(
                            width: 10,
                            height: 10,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                          )
                        else
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                              boxShadow: isRunning
                                  ? [
                                      BoxShadow(
                                        color: statusColor.withOpacity(0.5),
                                        blurRadius: 10,
                                        spreadRadius: 2,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                        SizedBox(width: 8),
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
                            SizedBox(width: 4),
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
            SizedBox(height: 24),
            SwipeButton(
              onSwipe: () {
                if (controller.isProcessing.value) return;
                if (isRunning) {
                  controller.stopMotor();
                } else {
                  controller.startMotor();
                }
              },
              label: controller.isProcessing.value ? 'Waiting for confirmation...' : (isRunning ? 'Swipe Left to Stop' : 'Swipe to Start'),
              icon: isRunning ? Icons.arrow_back_rounded : Icons.play_arrow_rounded,
              activeColor: isRunning ? AppColors.error : AppColors.primaryGreen,
              isEnabled: isConnected,
              disabledLabel: 'OFFLINE',
              direction: isRunning ? SwipeDirection.left : SwipeDirection.right,
            ),

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
                    SizedBox(width: 8),
                    Text(
                      'Device Location',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                SizedBox(height: 10),
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
            SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[1])),
            SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[6])),
          ],
        ),
        SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildMetricCard(metrics[3])),
            SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[4])),
            SizedBox(width: 8),
            Expanded(child: _buildMetricCard(metrics[5])),
          ],
        ),
        SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildMetricCard(metrics[2])),
            SizedBox(width: 8),
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
              SizedBox(height: 10),
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

class _TimeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _TimeChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
