import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../controllers/help_controller.dart';
import '../../data/models/help_model.dart';
import 'package:intl/intl.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(HelpController());
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('help_support'.tr, style: const TextStyle(fontWeight: FontWeight.w800)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () => controller.fetchHelpRequests(isRefresh: true),
        child: Obx(() {
          if (controller.isLoading.value && controller.helpRequests.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (controller.helpRequests.isEmpty) {
            return _buildEmptyState(context);
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: controller.helpRequests.length + (controller.hasNextPage.value ? 1 : 0),
            itemBuilder: (context, index) {
              if (index == controller.helpRequests.length) {
                controller.loadMore();
                return const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: CircularProgressIndicator(),
                  ),
                );
              }
              final help = controller.helpRequests[index];
              return _buildHelpCard(context, help, controller, isDark);
            },
          );
        }),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.toNamed('/create-help'),
        backgroundColor: AppColors.primaryGreen,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.8,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.help_outline, size: 80, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(
                'no_help_requests'.tr,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 8),
              Text(
                'need_assistance'.tr,
                style: TextStyle(color: Colors.grey.shade500),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Get.toNamed('/create-help'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('create_request'.tr, style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHelpCard(BuildContext context, HelpModel help, HelpController controller, bool isDark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => _showHelpDetails(context, help, controller),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      help.subject,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _buildStatusChip(help.status),
                ],
              ),
              if (help.deviceNickname != null || help.serialNumber != null) ...[
                const SizedBox(height: 4),
                Text(
                  help.deviceNickname != null 
                    ? '${help.deviceNickname} (${help.serialNumber})'
                    : help.serialNumber ?? '',
                  style: const TextStyle(fontSize: 12, color: AppColors.primaryGreen, fontWeight: FontWeight.w500),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                help.description,
                style: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    help.createdAt != null ? DateFormat('dd MMM yyyy, hh:mm a').format(help.createdAt!) : '',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                  ),
                  if (help.status == 'pending')
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                      onPressed: () => _showDeleteConfirmation(context, help, controller),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'pending':
        color = Colors.orange;
        break;
      case 'in-progress':
        color = Colors.blue;
        break;
      case 'completed':
        color = Colors.green;
        break;
      case 'rejected':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  void _showHelpDetails(BuildContext context, HelpModel help, HelpController controller) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Help Details', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                IconButton(onPressed: () => Get.back(), icon: const Icon(Icons.close)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 16),
            Text('Subject', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            Text(help.subject, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            Text('Description', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            Text(help.description, style: const TextStyle(fontSize: 14)),
            if (help.deviceNickname != null || help.serialNumber != null) ...[
              const SizedBox(height: 16),
              Text('Device', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
              Text(
                help.deviceNickname != null 
                  ? '${help.deviceNickname} (${help.serialNumber})'
                  : help.serialNumber ?? '',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Status', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    const SizedBox(height: 4),
                    _buildStatusChip(help.status),
                  ],
                ),
                const SizedBox(width: 40),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Date', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(help.createdAt != null ? DateFormat('dd MMM yyyy').format(help.createdAt!) : '',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (help.status == 'pending')
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Get.back();
                        Get.toNamed('/create-help', arguments: help);
                      },
                      child: const Text('Edit'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Get.back();
                        _showDeleteConfirmation(context, help, controller);
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('Delete', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, HelpModel help, HelpController controller) {
    Get.dialog(
      AlertDialog(
        title: const Text('Delete Request'),
        content: const Text('Are you sure you want to delete this help request?'),
        actions: [
          TextButton(onPressed: () => Get.back(), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Get.back();
              controller.deleteHelpRequest(help.id!);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
