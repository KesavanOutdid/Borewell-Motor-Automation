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
          IconButton(
            icon: const Icon(Icons.analytics),
            tooltip: 'Analytics',
            onPressed: () => _openAnalytics(controller),
          ),
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'History',
            onPressed: () => _openHistory(controller),
          ),
          Obx(() => Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Row(
                  children: [
                    Icon(
                      controller.isConnected.value
                          ? Icons.wifi
                          : Icons.wifi_off,
                      color: controller.isConnected.value
                          ? Colors.greenAccent
                          : Colors.redAccent,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      controller.isConnected.value ? 'Connected' : 'Offline',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              )),
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
                _buildDeviceInfoCard(controller),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Live Readings',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => _openHistory(controller),
                      icon: Icon(Icons.history, size: 20, color: AppColors.primaryGreen),
                      label: Text(
                        'History',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildLiveDataGrid(context, controller),
                const SizedBox(height: 16),
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

  Widget _buildDeviceInfoCard(DeviceDetailsController controller) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Device Information',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryGreen,
              ),
            ),
            const Divider(height: 24),
            _buildInfoRow('Serial Number', controller.liveData['serialNumber'] ?? '-'),
            const Divider(height: 20),
            _buildInfoRow('IMEI Number', controller.liveData['imei'] ?? '-'),
            const Divider(height: 20),
            _buildInfoRow('Motor HP', controller.liveData['motorHp'] ?? '-'),
            const Divider(height: 20),
            _buildInfoRow('Location', controller.liveData['location'] ?? '-'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusControlCard(DeviceDetailsController controller) {
    final isRunning = controller.liveData['motorStatus'] == 'Running';
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildInfoRow(
                    'Last updated on',
                    controller.liveData['lastUpdate'] ?? '-',
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Device Status',
                  style: TextStyle(
                    fontSize: 12,
                    color: Get.isDarkMode ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: (isRunning ? Colors.green : Colors.grey).withOpacity(0.2),
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
            const Divider(height: 20),
            _buildInfoRow('Device Last Start', controller.liveData['lastStart'] ?? '-'),
            const Divider(height: 20),
            _buildInfoRow('Device Last Stop', controller.liveData['lastStop'] ?? '-'),
            const SizedBox(height: 20),
            _buildSwipeControl(controller, isRunning),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationMapCard(DeviceDetailsController controller) {
    final latitude = controller.liveData['latitude'] ?? 28.6139;
    final longitude = controller.liveData['longitude'] ?? 77.2090;
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, color: Colors.green.shade700, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Device Location',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  controller.liveData['location']?.toString() ?? 'Location not available',
                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          SizedBox(
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
        'value': isRunning ? (controller.liveData['motorFrequency'] ?? '-') : '-',
        'icon': Icons.multiline_chart,
        'color': Colors.deepPurple,
      },
      {
        'label': 'Motor Energy',
        'value': isRunning ? (controller.liveData['motorEnergy'] ?? '-') : '-',
        'icon': Icons.electric_bolt,
        'color': Colors.orange,
      },
      {
        'label': 'Alert',
        'value': isRunning ? (controller.liveData['alert'] ?? '-') : '-',
        'icon': Icons.warning_amber,
        'color': Colors.redAccent,
      },
      {
        'label': 'Device Temperature',
        'value': isRunning ? (controller.liveData['deviceTemperature'] ?? '-') : '-',
        'icon': Icons.thermostat,
        'color': Colors.pinkAccent,
      },
      {
        'label': 'Motor Power',
        'value': isRunning ? (controller.liveData['motorPower'] ?? '-') : '-',
        'icon': Icons.power,
        'color': Colors.teal,
      },
      {
        'label': 'Flow Rate',
        'value': isRunning ? (controller.liveData['flowRate'] ?? '-') : '-',
        'icon': Icons.water_drop,
        'color': Colors.lightBlue,
      },
      {
        'label': 'Motor Speed',
        'value': isRunning ? (controller.liveData['motorSpeed'] ?? '-') : '-',
        'icon': Icons.speed,
        'color': Colors.indigo,
      },
      {
        'label': 'Signal Strength',
        'value': controller.liveData['signalStrength'] ?? '-',
        'icon': Icons.signal_cellular_alt,
        'color': Colors.green,
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
      color: metric['color'] as Color,
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
                    style: TextStyle(
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
