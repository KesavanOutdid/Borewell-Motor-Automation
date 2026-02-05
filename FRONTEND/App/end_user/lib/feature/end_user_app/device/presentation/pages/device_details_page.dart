import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shimmer/shimmer.dart';
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
      body: Obx(() {
        if (controller.isLoading.value) {
          return _buildSkeleton();
        }

        return RefreshIndicator(
          onRefresh: controller.refreshData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDevicePlacementCard(context, controller),
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

  Widget _buildSkeleton() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SingleChildScrollView(
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
                      onPressed: () => Get.back(),
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
                          Get.back();
                          controller.updateNickname(newName);
                        } else {
                          Get.snackbar(
                            'Error',
                            'Please enter a name',
                            snackPosition: SnackPosition.BOTTOM,
                            backgroundColor: Colors.red[100],
                          );
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
                        isRunning ? 'MOTOR RUNNING' : 'MOTOR STOPPED',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
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
            label: isRunning ? 'Swipe Left to Stop' : 'Swipe to Start',
            icon: isRunning ? Icons.arrow_back_rounded : Icons.play_arrow_rounded,
            activeColor: isRunning ? AppColors.error : AppColors.primaryGreen,
            isEnabled: isConnected,
            direction: isRunning ? SwipeDirection.left : SwipeDirection.right,
          ),
          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 16),
          _buildInfoRow('Last Updated', controller.liveData['lastUpdate'] ?? '-'),
          const SizedBox(height: 12),
          _buildInfoRow('Device Status', controller.liveData['deviceStatus'] ?? 'Ready'),
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

enum SwipeDirection { left, right }

class SwipeButton extends StatefulWidget {
  final VoidCallback onSwipe;
  final String label;
  final IconData icon;
  final Color activeColor;
  final bool isEnabled;
  final SwipeDirection direction;

  const SwipeButton({
    Key? key,
    required this.onSwipe,
    required this.label,
    required this.icon,
    required this.activeColor,
    this.isEnabled = true,
    this.direction = SwipeDirection.right,
  }) : super(key: key);

  @override
  State<SwipeButton> createState() => _SwipeButtonState();
}

class _SwipeButtonState extends State<SwipeButton> with SingleTickerProviderStateMixin {
  double _progress = 0.0; // 0.0 to 1.0
  bool _isSwiped = false;
  final double _height = 64.0;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _resetState();
  }

  void _resetState() {
    if (mounted) {
      setState(() {
        _progress = 0.0;
        _isSwiped = false;
      });
    }
  }

  @override
  void didUpdateWidget(SwipeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.direction != widget.direction) {
      _resetState();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        const double margin = 4.0;
        final thumbSize = _height - 8.0;
        final maxDragDistance = totalWidth - (margin * 2) - thumbSize;

        return Container(
          height: _height,
          width: totalWidth,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: widget.isEnabled 
                ? widget.activeColor.withOpacity(0.08)
                : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(_height / 2),
            border: Border.all(
              color: widget.isEnabled 
                  ? widget.activeColor.withOpacity(0.12)
                  : Colors.grey.shade300,
              width: 1.0,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Progress track fill
              Positioned(
                left: widget.direction == SwipeDirection.right ? margin : null,
                right: widget.direction == SwipeDirection.left ? margin : null,
                child: Container(
                  height: thumbSize,
                  width: (thumbSize + (_progress * maxDragDistance)).clamp(thumbSize, totalWidth - (margin * 2)),
                  decoration: BoxDecoration(
                    color: widget.activeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(thumbSize / 2),
                  ),
                ),
              ),

              // Label text
              Opacity(
                opacity: (1.0 - (_progress * 1.5)).clamp(0.0, 1.0),
                child: Text(
                  widget.isEnabled ? widget.label.toUpperCase() : 'OFFLINE',
                  style: TextStyle(
                    color: widget.isEnabled ? widget.activeColor.withOpacity(0.7) : Colors.grey,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.8,
                  ),
                ),
              ),

              // Animated Chevrons
              if (!_isSwiped && widget.isEnabled)
                Positioned(
                  left: widget.direction == SwipeDirection.right ? totalWidth * 0.38 : null,
                  right: widget.direction == SwipeDirection.left ? totalWidth * 0.38 : null,
                  child: FadeTransition(
                    opacity: _pulseController,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(2, (index) => Icon(
                        widget.direction == SwipeDirection.right ? Icons.chevron_right_rounded : Icons.chevron_left_rounded,
                        color: widget.activeColor.withOpacity(0.2),
                        size: 18,
                      )),
                    ),
                  ),
                ),

              // Thumb
              Positioned(
                left: widget.direction == SwipeDirection.right ? (margin + (_progress * maxDragDistance)) : null,
                right: widget.direction == SwipeDirection.left ? (margin + (_progress * maxDragDistance)) : null,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    if (!widget.isEnabled || _isSwiped) return;
                    
                    final delta = details.primaryDelta ?? 0;
                    final move = widget.direction == SwipeDirection.right ? delta : -delta;
                    
                    setState(() {
                      _progress = (_progress + (move / maxDragDistance)).clamp(0.0, 1.0);
                    });
                  },
                  onHorizontalDragEnd: (details) {
                    if (!widget.isEnabled || _isSwiped) return;

                    if (_progress > 0.75) {
                      setState(() {
                        _progress = 1.0;
                        _isSwiped = true;
                      });
                      widget.onSwipe();
                      
                      Future.delayed(const Duration(seconds: 2), () {
                        _resetState();
                      });
                    } else {
                      setState(() {
                        _progress = 0.0;
                      });
                    }
                  },
                  child: Container(
                    width: thumbSize,
                    height: thumbSize,
                    decoration: BoxDecoration(
                      color: widget.isEnabled ? widget.activeColor : Colors.grey.shade400,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (widget.isEnabled ? widget.activeColor : Colors.black).withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        _isSwiped ? Icons.check_rounded : widget.icon,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
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
