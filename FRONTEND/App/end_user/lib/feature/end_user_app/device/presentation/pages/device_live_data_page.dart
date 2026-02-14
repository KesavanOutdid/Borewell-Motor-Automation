import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'device_live_data_controller.dart';

class DeviceLiveDataView extends GetView<DeviceLiveDataController> {
  const DeviceLiveDataView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Live Device Data"),
        centerTitle: true,
        actions: [
          Obx(() => Padding(
                padding: const EdgeInsets.all(8.0),
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: controller.isConnected.value
                          ? Colors.green
                          : Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          controller.isConnected.value
                              ? Icons.wifi
                              : Icons.wifi_off,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          controller.isConnected.value
                              ? "Connected"
                              : "Disconnected",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )),
        ],
      ),
      body: Obx(() {
        if (!controller.isConnected.value) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.cloud_off,
                  size: 80,
                  color: Colors.grey,
                ),
                const SizedBox(height: 20),
                const Text(
                  "Device Disconnected",
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: controller.connectToDevice,
                  icon: const Icon(Icons.refresh),
                  label: const Text("Reconnect"),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: controller.refreshData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDeviceHeader(),
                const SizedBox(height: 20),
                _buildMotorStatusCard(),
                const SizedBox(height: 16),
                _buildDataGrid(),
                const SizedBox(height: 20),
                _buildLastUpdated(),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildDeviceHeader() {
    return Card(
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.water_drop,
                size: 32,
                color: Colors.green.shade700,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Obx(() => Text(
                        controller.deviceName.value,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      )),
                  const SizedBox(height: 4),
                  Obx(() => Text(
                        "ID: ${controller.deviceId.value}",
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMotorStatusCard() {
    return Obx(() {
      final isMotorOn = controller.motorStatus.value == "ON";
      return Card(
        elevation: 3,
        color: isMotorOn ? Colors.green.shade50 : Colors.red.shade50,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(
                isMotorOn ? Icons.power : Icons.power_off,
                size: 40,
                color: isMotorOn ? Colors.green : Colors.red,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Motor Status",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      controller.motorStatus.value,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: isMotorOn ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isMotorOn,
                onChanged: (value) {
                  controller.toggleMotor();
                },
                activeColor: Colors.green,
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildDataGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Live Sensor Data",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.3,
          children: [
            _buildDataCard(
              title: "Voltage",
              icon: Icons.electric_bolt,
              color: Colors.orange,
              valueObservable: controller.voltage,
              unit: "V",
              paramKey: "voltage",
            ),
            _buildDataCard(
              title: "Current",
              icon: Icons.flash_on,
              color: Colors.blue,
              valueObservable: controller.current,
              unit: "A",
              paramKey: "current",
            ),
            _buildDataCard(
              title: "Power",
              icon: Icons.power,
              color: Colors.purple,
              valueObservable: controller.power,
              unit: "W",
              paramKey: "power",
            ),
            _buildDataCard(
              title: "Water Level",
              icon: Icons.water,
              color: Colors.cyan,
              valueObservable: controller.waterLevel,
              unit: "%",
              paramKey: "water_level",
            ),
            _buildDataCard(
              title: "Temperature",
              icon: Icons.thermostat,
              color: Colors.red,
              valueObservable: controller.temperature,
              unit: "°C",
              paramKey: "temperature",
            ),
            _buildDataCard(
              title: "Runtime",
              icon: Icons.timer,
              color: Colors.teal,
              valueObservable: controller.runtime,
              unit: "hrs",
              paramKey: "runtime",
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDataCard({
    required String title,
    required IconData icon,
    required Color color,
    required RxString valueObservable,
    required String unit,
    required String paramKey,
  }) {
    return GestureDetector(
      onTap: () {
        Get.toNamed('/deviceHistory', arguments: {
          'parameter': title,
          'paramKey': paramKey,
          'unit': unit,
          'deviceId': controller.deviceId.value,
        });
      },
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, color: color, size: 24),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 12,
                    color: Colors.grey.shade400,
                  ),
                ],
              ),
              const Spacer(),
              Obx(() => Text(
                    valueObservable.value,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  )),
              const SizedBox(height: 4),
              Text(
                unit,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLastUpdated() {
    return Obx(() => Center(
          child: Text(
            "Last updated: ${controller.lastUpdated.value}",
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
              fontStyle: FontStyle.italic,
            ),
          ),
        ));
  }
}
