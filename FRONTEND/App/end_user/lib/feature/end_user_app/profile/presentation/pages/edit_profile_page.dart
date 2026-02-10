import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../../core/config/env.dart';
import '../controllers/profile_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final controller = Get.find<ProfileController>();

  @override
  void initState() {
    super.initState();
    controller.initEditFields();
  }

  void _showImageSourceDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Profile Photo',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSourceOption(
                  context,
                  icon: Icons.camera_alt_rounded,
                  label: 'Camera',
                  onTap: () {
                    Navigator.pop(context);
                    controller.pickAndUploadImage(ImageSource.camera);
                  },
                ),
                _buildSourceOption(
                  context,
                  icon: Icons.photo_library_rounded,
                  label: 'Gallery',
                  onTap: () {
                    Navigator.pop(context);
                    controller.pickAndUploadImage(ImageSource.gallery);
                  },
                ),
                if (controller.userProfileImage.value.isNotEmpty)
                  _buildSourceOption(
                    context,
                    icon: Icons.delete_outline_rounded,
                    label: 'Remove',
                    onTap: () {
                      Navigator.pop(context);
                      _showRemoveImageConfirmation(context);
                    },
                    color: Colors.red,
                  ),
              ],
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  void _showRemoveImageConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
        title: const Text('Remove Photo'),
        content: const Text('Are you sure you want to remove your profile photo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              controller.removeProfileImage();
            },
            child: const Text(
              'Remove',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final effectiveColor = color ?? AppColors.primaryGreen;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: effectiveColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: effectiveColor,
              size: 30,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Edit Profile'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : AppColors.textPrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Stack(
                children: [
                  Obx(() => Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primaryGreen, width: 2),
                    ),
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.primaryGreen.withOpacity(0.1),
                      backgroundImage: controller.userProfileImage.value.isNotEmpty
                          ? NetworkImage("${AppConfig.baseUrl}${controller.userProfileImage.value}")
                          : null,
                      child: controller.userProfileImage.value.isEmpty
                          ? Text(
                              controller.userName.value.isNotEmpty
                                  ? controller.userName.value[0].toUpperCase()
                                  : 'U',
                              style: const TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryGreen,
                              ),
                            )
                          : null,
                    ),
                  )),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: () => _showImageSourceDialog(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            _buildTextField(
              label: 'Full Name',
              hint: 'Enter your name',
              icon: Icons.person_outline,
              controller: controller.nameEditingController,
            ),
            const SizedBox(height: 20),
            _buildTextField(
              label: 'Email Address',
              hint: 'Enter your email',
              icon: Icons.email_outlined,
              controller: controller.emailEditingController,
              keyboardType: TextInputType.emailAddress,
              enabled: false,
            ),
            const SizedBox(height: 20),
            _buildTextField(
              label: 'Phone Number',
              hint: 'Enter 10 digit number',
              icon: Icons.phone_outlined,
              controller: controller.phoneEditingController,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              enabled: false,
            ),
            const SizedBox(height: 20),
            Obx(() => _buildTextField(
                  label: 'Password',
                  hint: 'Update your password',
                  icon: Icons.lock_outline,
                  controller: controller.passwordEditingController,
                  obscureText: !controller.isPasswordVisible.value,
                  suffixIcon: IconButton(
                    icon: Icon(
                      controller.isPasswordVisible.value
                          ? Icons.visibility
                          : Icons.visibility_off,
                      size: 20,
                    ),
                    onPressed: () => controller.isPasswordVisible.toggle(),
                  ),
                )),
            const SizedBox(height: 40),
            Obx(() => SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: controller.isUpdating.value || !controller.hasChanges.value
                        ? null
                        : () async {
                            final error = await controller.updateProfile();
                            if (error == null) {
                              Navigator.of(context).pop();
                              Get.rawSnackbar(
                                title: 'Success',
                                message: 'Profile updated successfully',
                                backgroundColor: AppColors.success,
                              );
                            } else {
                              Get.rawSnackbar(
                                title: 'Error',
                                message: error,
                                backgroundColor: AppColors.error,
                              );
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      disabledBackgroundColor: AppColors.primaryGreen.withOpacity(0.5),
                    ),
                    child: controller.isUpdating.value
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          )
                        : const Text(
                            'Save Changes',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required IconData icon,
    required TextEditingController controller,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    int? maxLength,
    bool enabled = true,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.grey[400] : Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          obscureText: obscureText,
          maxLength: maxLength,
          style: TextStyle(
            color: enabled 
                ? (isDark ? Colors.white : AppColors.textPrimary)
                : Colors.grey[500],
            fontSize: 16,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
            prefixIcon: Icon(
              icon, 
              size: 20, 
              color: enabled ? AppColors.primaryGreen : Colors.grey[400]
            ),
            suffixIcon: suffixIcon,
            counterText: "",
            filled: true,
            fillColor: isDark 
                ? (enabled ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.02))
                : (enabled ? Colors.white : Colors.grey.shade100),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade200,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
