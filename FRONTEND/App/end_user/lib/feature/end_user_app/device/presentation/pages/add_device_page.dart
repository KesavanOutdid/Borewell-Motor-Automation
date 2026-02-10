import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/add_device_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class ConfigureDeviceView extends StatelessWidget {
  const ConfigureDeviceView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ConfigureDeviceController());
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Configure Device', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppColors.textPrimary,
      ),
      body: Obx(() => SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.cardDark : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.settings_input_component_rounded, color: AppColors.primaryGreen, size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Device Hardware',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  'Serial ${controller.serialNumber}',
                                  style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      _buildTextField(
                        controller: controller.imeiController,
                        label: 'IMEI Number',
                        hint: 'Enter 15-digit IMEI',
                        icon: Icons.phonelink_setup_rounded,
                        keyboardType: TextInputType.number,
                        maxLength: 15,
                        suffix: IconButton(
                          icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primaryGreen),
                          onPressed: () => controller.scanQRCode(),
                        ),
                        isDark: isDark,
                      ),
                      const SizedBox(height: 20),
                      _buildTextField(
                        controller: controller.nicknameController,
                        label: 'Device Nickname',
                        hint: 'e.g., Main Borewell',
                        icon: Icons.drive_file_rename_outline_rounded,
                        isDark: isDark,
                      ),
                      const SizedBox(height: 20),
                      _buildTextField(
                        controller: controller.locationController,
                        label: 'Device Location',
                        hint: 'e.g., Farm Sector A',
                        icon: Icons.location_on_rounded,
                        suffix: controller.isGettingLocation.value
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : IconButton(
                                icon: const Icon(Icons.my_location_rounded, color: AppColors.primaryGreen),
                                onPressed: () => controller.getCurrentLocation(),
                              ),
                        isDark: isDark,
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: () => controller.pickLocationOnMap(),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: const [
                              Icon(Icons.map_rounded, size: 18, color: AppColors.primaryGreen),
                              SizedBox(width: 8),
                              Text('Pick from map', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w600, fontSize: 13)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildTextField(
                        controller: controller.motorHpController,
                        label: 'Motor Capacity (HP)',
                        hint: 'e.g., 5.0',
                        icon: Icons.speed_rounded,
                        keyboardType: TextInputType.number,
                        isDark: isDark,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _buildInstructions(isDark),
                const SizedBox(height: 32),
                _buildActionButtons(controller),
              ],
            ),
          )),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required bool isDark,
    TextInputType? keyboardType,
    int? maxLength,
    Widget? suffix,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? Colors.grey[400] : Colors.grey[600])),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLength: maxLength,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20, color: AppColors.primaryGreen),
            suffixIcon: suffix,
            counterText: "",
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInstructions(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primaryGreen.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
              const SizedBox(width: 8),
              Text('Configuration Guide', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
            ],
          ),
          const SizedBox(height: 16),
          _instructionRow('1', 'Find the 15-digit IMEI on device label', isDark),
          _instructionRow('2', 'Use the QR scanner for quick entry', isDark),
          _instructionRow('3', 'Set accurate location for tracking', isDark),
        ],
      ),
    );
  }

  Widget _instructionRow(String step, String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(step, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen))),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: isDark ? Colors.grey[400] : Colors.grey[700]))),
        ],
      ),
    );
  }

  Widget _buildActionButtons(ConfigureDeviceController controller) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: controller.isLoading.value ? null : () => controller.configureDevice(),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: controller.isLoading.value
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
            : const Text('CONFIGURE DEVICE', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
    );
  }
}
