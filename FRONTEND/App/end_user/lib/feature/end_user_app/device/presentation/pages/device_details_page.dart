import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../controllers/device_details_controller.dart';

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
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    TextButton.icon(
                      onPressed: () => _openHistory(controller),
                      icon: const Icon(Icons.history, size: 18),
                      label: const Text('History'),
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

  Widget _buildDeviceInfoCard(DeviceDetailsController controller) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
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
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Device Status',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 4),
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
                ),
              ],
            ),
            const Divider(height: 20),
            _buildInfoRow('Device Last Start', controller.liveData['lastStart'] ?? '-'),
            const Divider(height: 20),
            _buildInfoRow('Device Last Stop', controller.liveData['lastStop'] ?? '-'),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: controller.isConnected.value && !isRunning
                        ? () => controller.startMotor()
                        : null,
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('START'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: controller.isConnected.value && isRunning
                        ? () => controller.stopMotor()
                        : null,
                    icon: const Icon(Icons.stop),
                    label: const Text('STOP'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Device live location',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Latitude: $latitude, Longitude: $longitude',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
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
          style: TextStyle(fontSize: 13, color: Colors.grey[600]),
        ),
        Flexible(
          child: Text(
            displayValue,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
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
        'value': controller.liveData['motorFrequency'],
        'icon': Icons.multiline_chart,
        'color': Colors.pink,
      },
      {
        'label': 'Motor Energy',
        'value': controller.liveData['motorEnergy'],
        'icon': Icons.electric_bolt,
        'color': Colors.amber,
      },
      {
        'label': 'Alert',
        'value': controller.liveData['alert'],
        'icon': Icons.warning_amber,
        'color': Colors.orange,
      },
      {
        'label': 'Device Temperature',
        'value': controller.liveData['deviceTemperature'],
        'icon': Icons.thermostat,
        'color': Colors.red,
      },
      {
        'label': 'Motor Power',
        'value': controller.liveData['motorPower'],
        'icon': Icons.power,
        'color': Colors.yellow[700],
      },
      {
        'label': 'Flow Rate',
        'value': controller.liveData['flowRate'],
        'icon': Icons.water_drop,
        'color': Colors.blue,
      },
      {
        'label': 'Motor Speed',
        'value': controller.liveData['motorSpeed'],
        'icon': Icons.speed,
        'color': Colors.purple,
      },
      {
        'label': 'Signal Strength',
        'value': controller.liveData['signalStrength'],
        'icon': Icons.signal_cellular_alt,
        'color': Colors.green,
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.3,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final metric = metrics[index];
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  metric['icon'] as IconData,
                  color: metric['color'] as Color?,
                  size: 28,
                ),
                const SizedBox(height: 8),
                Text(
                  metric['label'] as String,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${metric['value']}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: metric['color'] as Color?,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

}
