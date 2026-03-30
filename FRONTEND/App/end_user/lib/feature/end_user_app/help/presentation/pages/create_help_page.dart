import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../controllers/help_controller.dart';
import '../../data/models/help_model.dart';
import '../../../../../utils/widgets/ui_components.dart';

class CreateHelpPage extends StatefulWidget {
  const CreateHelpPage({super.key});

  @override
  State<CreateHelpPage> createState() => _CreateHelpPageState();
}

class _CreateHelpPageState extends State<CreateHelpPage> {
  final HelpController controller = Get.find<HelpController>();
  HelpModel? editingHelp;

  @override
  void initState() {
    super.initState();
    if (Get.arguments is HelpModel) {
      editingHelp = Get.arguments as HelpModel;
      if (controller.subjects.contains(editingHelp!.subject)) {
        controller.selectedSubject.value = editingHelp!.subject;
        controller.showCustomSubject.value = false;
      } else {
        controller.selectedSubject.value = 'Other';
        controller.showCustomSubject.value = true;
      }
      
      // Handle existing device if editing
      if (editingHelp!.serialNumber != null) {
        // Try to find the device in userDevices
        final existingDevice = controller.userDevices.firstWhereOrNull(
          (d) => (d['serial_number'] ?? d['serialNumber']) == editingHelp!.serialNumber
        );
        if (existingDevice != null) {
          controller.selectedDevice.value = existingDevice;
        }
      }

      controller.subjectController.text = editingHelp!.subject;
      controller.descriptionController.text = editingHelp!.description;
    } else {
      controller.resetForm();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          editingHelp == null ? 'create_help'.tr : 'update_help'.tr,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'how_can_we_help'.tr,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'describe_issue'.tr,
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 32),
            _buildLabel('Select Device (Optional)'),
            const SizedBox(height: 8),
            Obx(() => DropdownButtonFormField<Map<String, dynamic>>(
              value: controller.selectedDevice.value,
              items: controller.userDevices.map((device) {
                final name = device['device_nickname'] ?? device['nickname'] ?? '-';
                final serial = device['serial_number'] ?? device['serialNumber'] ?? '-';
                return DropdownMenuItem<Map<String, dynamic>>(
                  value: device,
                  child: Text(name != '-' ? '$name ($serial)' : serial),
                );
              }).toList(),
              onChanged: controller.onDeviceChanged,
              decoration: _inputDecoration('Choose a device', isDark),
              dropdownColor: isDark ? Colors.grey.shade900 : Colors.white,
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
            )),
            const SizedBox(height: 24),
            _buildLabel('subject'.tr),
            const SizedBox(height: 8),
            Obx(() => DropdownButtonFormField<String>(
              value: controller.selectedSubject.value.isEmpty ? null : controller.selectedSubject.value,
              items: controller.subjects.map((String sub) {
                return DropdownMenuItem<String>(
                  value: sub,
                  child: Text(sub),
                );
              }).toList(),
              onChanged: controller.onSubjectChanged,
              decoration: _inputDecoration('Select Subject', isDark),
              dropdownColor: isDark ? Colors.grey.shade900 : Colors.white,
              icon: const Icon(Icons.keyboard_arrow_down_rounded),
            )),
            Obx(() => controller.showCustomSubject.value 
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    _buildLabel('${'subject'.tr} (Custom)'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: controller.subjectController,
                      enableSuggestions: false,
                      autocorrect: false,
                      decoration: _inputDecoration('Type your subject here...', isDark),
                    ),
                  ],
                )
              : const SizedBox.shrink()
            ),
            const SizedBox(height: 24),
            _buildLabel('description'.tr),
            const SizedBox(height: 8),
            TextFormField(
              controller: controller.descriptionController,
              maxLines: 5,
              enableSuggestions: false,
              autocorrect: false,
              decoration: _inputDecoration('description_hint'.tr, isDark),
            ),
            const SizedBox(height: 40),
            Obx(() => PrimaryButton(
              text: (editingHelp == null ? 'submit'.tr : 'update'.tr).toUpperCase(),
              isLoading: controller.isSubmitting.value,
              onPressed: () async {
                bool success;
                if (editingHelp == null) {
                  success = await controller.createHelpRequest();
                } else {
                  success = await controller.updateHelpRequest(editingHelp!.id!);
                }
                if (success) {
                  Navigator.pop(context);
                }
              },
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
    );
  }

  InputDecoration _inputDecoration(String hint, bool isDark) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: isDark ? Colors.grey.shade900 : Colors.grey.shade100,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.all(16),
    );
  }
}
