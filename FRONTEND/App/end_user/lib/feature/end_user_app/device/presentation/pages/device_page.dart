import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/device_controller.dart';

class DeviceView extends GetView<DeviceController> {
  const DeviceView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Device Details"),
        centerTitle: true,
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.deviceDetails.isEmpty) {
          return const Center(child: Text("No device details available"));
        }

        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Device Name: ${controller.deviceDetails['name'] ?? 'N/A'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Status: ${controller.deviceDetails['status'] ?? 'N/A'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'ID: ${controller.deviceDetails['id'] ?? 'N/A'}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      controller.updateDeviceStatus(
                        controller.deviceDetails['id'] ?? '',
                        'ON',
                      );
                    },
                    child: const Text("Turn ON"),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      controller.updateDeviceStatus(
                        controller.deviceDetails['id'] ?? '',
                        'OFF',
                      );
                    },
                    child: const Text("Turn OFF"),
                  ),
                ],
              ),
            ],
          ),
        );
      }),
    );
  }
}
