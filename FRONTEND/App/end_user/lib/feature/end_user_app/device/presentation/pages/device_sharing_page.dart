import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/device_sharing_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class DeviceSharingView extends GetView<DeviceSharingController> {
  const DeviceSharingView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final phoneController = TextEditingController();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Sharing'),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.sharedUsers.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Share device with others',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You can share this device with up to 3 additional persons. They will be able to start, stop and view readings.',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              const SizedBox(height: 20),
              if (controller.sharedUsers.length < 3)
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: phoneController,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                        decoration: InputDecoration(
                          hintText: 'Enter phone number',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.phone),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (phoneController.text.length == 10) {
                          controller.assignToUser(phoneController.text);
                          phoneController.clear();
                        } else {
                          Get.snackbar(
                            'Invalid Number',
                            'Please enter a 10-digit phone number',
                            snackPosition: SnackPosition.BOTTOM,
                            backgroundColor: Colors.red.withOpacity(0.8),
                            colorText: Colors.white,
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Share'),
                    ),
                  ],
                ),
              const SizedBox(height: 32),
              Text(
                'Shared Users (${controller.sharedUsers.length}/3)',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: controller.sharedUsers.isEmpty
                    ? Center(
                        child: Text(
                          'No users shared yet',
                          style: TextStyle(color: Colors.grey[400]),
                        ),
                      )
                    : ListView.builder(
                        itemCount: controller.sharedUsers.length,
                        itemBuilder: (context, index) {
                          final user = controller.sharedUsers[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              title: Text(user['shared_to_user_name'] ?? 'Unknown'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(user['shared_to_user_phone']?.toString() ?? ''),
                                  const SizedBox(height: 4),
                                  _buildStatusBadge(user['acceptance_status'] ?? 'pending'),
                                ],
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Switch(
                                    value: user['status'] ?? false,
                                    onChanged: (val) => controller.updateStatus(
                                      user['shared_to_user_id'],
                                      val,
                                    ),
                                    activeColor: AppColors.primaryGreen,
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => _confirmDelete(context, user),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      }),
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> user) {
    Get.dialog(
      Builder(
        builder: (dialogContext) => AlertDialog(
          title: const Text('Delete Share'),
          content: Text('Are you sure you want to remove sharing for ${user['shared_to_user_name']}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext, rootNavigator: true).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext, rootNavigator: true).pop();
                controller.deleteShare(user['shared_to_user_id']);
              },
              child: const Text('Delete', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'accepted':
        color = Colors.green;
        break;
      case 'rejected':
        color = Colors.red;
        break;
      default:
        color = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
