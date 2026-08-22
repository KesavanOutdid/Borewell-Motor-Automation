import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/device_sharing_controller.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../core/services/tour_service.dart';

class DeviceSharingView extends GetView<DeviceSharingController> {
  const DeviceSharingView({super.key});

  @override
  Widget build(BuildContext context) {
    final phoneController = TextEditingController();
    final tourService = Get.find<TourService>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (context.mounted) {
          tourService.showSharingTour(context);
        }
      });
    });

    return Scaffold(
      appBar: AppBar(
        title: Text('device_access'.tr),
      ),
      body: RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () async => await controller.fetchSharedUsers(),
        child: Obx(() {
          if (controller.isLoading.value && controller.sharedUsers.isEmpty) {
            return Center(child: CircularProgressIndicator());
          }

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            children: [
              KeyedSubtree(
                key: tourService.shareAddSectionKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Add Device Access',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'You can grant access for this device with up to 3 additional persons. They will be able to start, stop and view readings.',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                    SizedBox(height: 20),
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
                                hintText: 'phone_hint'.tr,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                prefixIcon: const Icon(Icons.phone),
                              ),
                            ),
                          ),
                          SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: () {
                              if (phoneController.text.length == 10) {
                                controller.assignToUser(phoneController.text);
                                phoneController.clear();
                              } else {
                                Get.snackbar(
                                  'Invalid Number',
                                  'Please enter a 10-digit phone number',
                                  snackPosition: SnackPosition.TOP,
                                  backgroundColor: Colors.red.withValues(alpha: 0.8),
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
                            child: Text('add'.tr),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              SizedBox(height: 32),
              KeyedSubtree(
                key: tourService.sharedUsersListKey,
                child: Text(
                  'Access Granted (${controller.sharedUsers.length}/3)',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              SizedBox(height: 16),
              if (controller.sharedUsers.isEmpty)
                SizedBox(
                  height: 200,
                  child: Center(
                    child: Text(
                      'No access granted yet',
                      style: TextStyle(color: Colors.grey[400]),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
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
                            SizedBox(height: 4),
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
                              activeThumbColor: AppColors.primaryGreen,
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
            ],
          );
        }),
      ),
    );
  }

  void _confirmDelete(BuildContext context, Map<String, dynamic> user) {
    Get.dialog(
      Builder(
        builder: (dialogContext) => AlertDialog(
          title: Text('remove_access'.tr),
          content: Text('Are you sure you want to remove access for ${user['shared_to_user_name']}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext, rootNavigator: true).pop(),
              child: Text('cancel'.tr),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext, rootNavigator: true).pop();
                controller.deleteShare(user['shared_to_user_id']);
              },
              child: Text('remove'.tr, style: TextStyle(color: Colors.red)),
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
