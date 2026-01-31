import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../controllers/device_details_controller.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';

class DeviceDetailsView extends GetView<DeviceDetailsController> {
  const DeviceDetailsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final rawArgs = Get.arguments;
    final deviceArgs = rawArgs is Map<String, dynamic> ? rawArgs : <String, dynamic>{};

    controller.initialize(deviceArgs);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Details'),
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
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        return RefreshIndicator(
          onRefresh: controller.refreshData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDevicePlacementCard(controller),
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
                _buildLiveDataGrid(context, controller),
                const SizedBox(height: 20),
                _buildLocationMapCard(controller),
                const SizedBox(height: 20),
                _buildStatusControlCard(controller),
              ],
            ),
          ),
        );
      }),
    );
  }

  void _openHistory(DeviceDetailsController controller) {
    final serial = controller.liveData['serialNumber']?.toString();
    final imei = controller.liveData['imei']?.toString();

    if (serial == null || serial.trim().isEmpty || imei == null || imei.trim().isEmpty) {
      Get.snackbar(
        'History',
        'Device information unavailable',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 2),
      );
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
      Get.snackbar(
        'Analytics',
        'Device information unavailable',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 2),
      );
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
       Get.snackbar('Error', 'Device information unavailable');
       return;
    }
    Get.toNamed('/device/sharing', arguments: {
      'serial_number': serial,
    });
  }

  Widget _buildRoleBadge(String role) {
    final isMaster = role == 'master';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (isMaster ? Colors.blue : Colors.orange).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: (isMaster ? Colors.blue : Colors.orange).withOpacity(0.3),
        ),
      ),
      child: Text(
        isMaster ? 'Master' : 'Shared',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isMaster ? Colors.blue : Colors.orange,
        ),
      ),
    );
  }

  Widget _buildQuickActionsRow(BuildContext context, DeviceDetailsController controller) {
    final isMaster = controller.liveData['role'] == 'master';
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
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
          if (isMaster)
            Expanded(
              child: _QuickActionCard(
                icon: Icons.share_rounded,
                label: 'Share',
                gradient: AppColors.primaryGradient,
                onTap: () => _openSharing(controller),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDevicePlacementCard(DeviceDetailsController controller) {
    final serialNumber = controller.liveData['serialNumber'] ?? 'N/A';
    final location = controller.liveData['location'] ?? 'Location not set';
    final motorHp = controller.liveData['motorHp'] ?? '-';
    final imei = controller.liveData['imei'] ?? 'N/A';
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.router_rounded,
                  color: AppColors.primaryGreen,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            serialNumber,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        _buildRoleBadge(controller.liveData['role'] ?? 'master'),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Motor HP $motorHp',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Icon(Icons.location_on_rounded, size: 18, color: Colors.grey.shade400),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  location,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.sim_card_rounded, size: 18, color: Colors.grey.shade400),
              const SizedBox(width: 8),
              Text(
                'IMEI $imei',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusControlCard(DeviceDetailsController controller) {
    final isRunning = controller.liveData['motorStatus'] == 'Running';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow(
            'Last updated on',
            controller.liveData['lastUpdate'] ?? '-',
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Device Status',
                style: TextStyle(
                  fontSize: 13,
                  color: Get.isDarkMode ? Colors.grey[400] : Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: (isRunning ? Colors.green : Colors.grey).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  controller.liveData['deviceStatus'] ?? 'Ready',
                  style: TextStyle(
                    color: isRunning ? Colors.green : Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoRow('Device Last Start', controller.liveData['lastStart'] ?? '-'),
          const SizedBox(height: 16),
          _buildInfoRow('Device Last Stop', controller.liveData['lastStop'] ?? '-'),
          const SizedBox(height: 24),
          _buildSwipeControl(controller, isRunning),
        ],
      ),
    );
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
            color: Colors.black.withOpacity(0.04),
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
    final isRunning = controller.liveData['motorStatus'] == 'Running';
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

  Widget _buildSwipeControl(DeviceDetailsController controller, bool isRunning) {
    return _SwipeControlWidget(
      controller: controller,
      isRunning: isRunning,
    );
  }

}

class _SwipeControlWidget extends StatefulWidget {
  final DeviceDetailsController controller;
  final bool isRunning;

  const _SwipeControlWidget({
    required this.controller,
    required this.isRunning,
  });

  @override
  State<_SwipeControlWidget> createState() => _SwipeControlWidgetState();
}

class _SwipeControlWidgetState extends State<_SwipeControlWidget> {
  double _dragPosition = 0.0;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width - 100;
    final maxDrag = screenWidth - 70;
    final progressRatio = (_dragPosition.abs() / maxDrag).clamp(0.0, 1.0);
    final isConnected = widget.controller.isConnected.value;
    
    return Opacity(
      opacity: isConnected ? 1.0 : 0.5,
      child: Container(
        height: 65,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(35),
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: widget.isRunning 
                ? [AppColors.error, AppColors.error.withOpacity(0.8)]
                : [AppColors.lightGreen, AppColors.primaryGreen],
          ),
          boxShadow: [
            BoxShadow(
              color: (widget.isRunning ? AppColors.error : AppColors.primaryGreen).withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            Center(
              child: AnimatedOpacity(
                opacity: (1.0 - progressRatio * 2.0).clamp(0.0, 1.0),
                duration: const Duration(milliseconds: 100),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (widget.isRunning) ...[
                      Icon(
                        Icons.chevron_left,
                        color: Colors.white.withOpacity(0.9),
                        size: 28,
                      ),
                      const SizedBox(width: 8),
                    ] else ...[
                      Icon(
                        Icons.chevron_right,
                        color: Colors.white.withOpacity(0.9),
                        size: 28,
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      widget.isRunning ? 'Swipe Left to Stop' : 'Swipe Right to Start',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                        letterSpacing: 0.5,
                      ),
                    ),
                    if (widget.isRunning) ...[
                      const SizedBox(width: 8),
                      Icon(
                        Icons.chevron_left,
                        color: Colors.white.withOpacity(0.9),
                        size: 28,
                      ),
                    ] else ...[
                      const SizedBox(width: 8),
                      Icon(
                        Icons.chevron_right,
                        color: Colors.white.withOpacity(0.9),
                        size: 28,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            AnimatedPositioned(
              duration: const Duration(milliseconds: 30),
              curve: Curves.easeOut,
              left: widget.isRunning ? null : 3 + _dragPosition,
              right: widget.isRunning ? 3 + _dragPosition.abs() : null,
              top: 3,
              child: GestureDetector(
                onHorizontalDragUpdate: (details) {
                  if (_isProcessing || !isConnected) return;
                  setState(() {
                    if (!widget.isRunning && details.delta.dx > 0) {
                      _dragPosition = (_dragPosition + details.delta.dx).clamp(0.0, maxDrag);
                    } else if (widget.isRunning && details.delta.dx < 0) {
                      _dragPosition = (_dragPosition + details.delta.dx).clamp(-maxDrag, 0.0);
                    }
                  });
                },
                onHorizontalDragEnd: (details) async {
                  if (_isProcessing || !isConnected) return;
                  
                  if (_dragPosition.abs() > maxDrag * 0.7) {
                    setState(() => _isProcessing = true);
                    
                    if (_dragPosition > 0) {
                      await widget.controller.startMotor();
                    } else {
                      await widget.controller.stopMotor();
                    }
                    
                    setState(() => _isProcessing = false);
                  }
                  
                  setState(() => _dragPosition = 0.0);
                },
                child: Container(
                  width: 59,
                  height: 59,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 10,
                        spreadRadius: 1,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: _isProcessing
                      ? Padding(
                          padding: const EdgeInsets.all(15),
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              widget.isRunning ? AppColors.error : AppColors.primaryGreen,
                            ),
                          ),
                        )
                      : Icon(
                          widget.isRunning 
                              ? Icons.arrow_back_rounded 
                              : Icons.play_arrow_rounded,
                          color: widget.isRunning ? AppColors.error : AppColors.primaryGreen,
                          size: 34,
                        ),
                ),
              ),
            ),
          ],
        ),
    ),
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
