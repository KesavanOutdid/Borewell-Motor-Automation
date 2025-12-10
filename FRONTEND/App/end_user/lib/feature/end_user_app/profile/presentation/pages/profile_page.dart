import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import '../controllers/profile_controller.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import '../../../../../utils/theme/theme_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class ProfileView extends GetView<ProfileController> {
  const ProfileView({super.key});

  void _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
    );
    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
      }
    } catch (e) {
      print('Error launching email: $e');
    }
  }

  void _showThemeDialog(BuildContext context) {
    final themeController = Get.find<ThemeController>();
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
          title: const Text('Choose Theme'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<ThemeMode>(
                title: const Text('Light'),
                value: ThemeMode.light,
                groupValue: themeController.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeController.setLight();
                    Navigator.pop(context);
                  }
                },
              ),
              RadioListTile<ThemeMode>(
                title: const Text('Dark'),
                value: ThemeMode.dark,
                groupValue: themeController.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeController.setDark();
                    Navigator.pop(context);
                  }
                },
              ),
              RadioListTile<ThemeMode>(
                title: const Text('System Default'),
                value: ThemeMode.system,
                groupValue: themeController.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeController.setSystem();
                    Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('No'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  final loginController = Get.find<LoginController>();
                  await loginController.logout();
                  
                  Get.delete<HomeController>();
                } catch (e) {
                  print('Logout error: $e');
                }
                
                await Future.delayed(const Duration(milliseconds: 200));
                Get.offAllNamed('/login');
              },
              child: const Text(
                'Yes',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showEditProfileDialog(BuildContext context) {
    controller.initEditFields();
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Theme(
          data: Theme.of(context),
          child: AlertDialog(
            backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
            title: const Text('Edit Profile'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: controller.nameEditingController,
                    decoration: const InputDecoration(
                      labelText: 'Name',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller.emailEditingController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller.phoneEditingController,
                    decoration: const InputDecoration(
                      labelText: 'Phone',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                  ),
                  const SizedBox(height: 16),
                  Obx(() => TextField(
                    controller: controller.passwordEditingController,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(
                          controller.isPasswordVisible.value
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          controller.isPasswordVisible.value = !controller.isPasswordVisible.value;
                        },
                      ),
                    ),
                    obscureText: !controller.isPasswordVisible.value,
                    maxLength: 6,
                  )),
                ],
              ),
            ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Cancel'),
            ),
            Obx(() => TextButton(
              onPressed: controller.isUpdating.value || !controller.hasChanges.value
                  ? null
                  : () async {
                      final error = await controller.updateProfile();
                      if (error == null) {
                        Navigator.pop(context);
                        Get.snackbar(
                          'Success',
                          'Profile updated successfully',
                          snackPosition: SnackPosition.BOTTOM,
                          backgroundColor: AppColors.success,
                          colorText: Colors.white,
                        );
                      } else {
                        Get.snackbar(
                          'Error',
                          error,
                          snackPosition: SnackPosition.BOTTOM,
                          backgroundColor: AppColors.error,
                          colorText: Colors.white,
                        );
                      }
                    },
              child: controller.isUpdating.value
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            )),
          ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.errorMessage.value.isNotEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  controller.errorMessage.value,
                  style: const TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => controller.fetchProfile(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF16A34A), Color(0xFF10B981)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(30),
                    bottomRight: Radius.circular(30),
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -40,
                      top: -40,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Positioned(
                      right: 20,
                      bottom: -50,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Profile',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 32),
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 45,
                                  backgroundColor: Colors.white,
                                  child: Text(
                                    controller.userName.value.isNotEmpty
                                        ? controller.userName.value[0].toUpperCase()
                                        : 'U',
                                    style: const TextStyle(
                                      fontSize: 36,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primaryGreen,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              controller.userName.value,
                                              style: const TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.edit, color: Colors.white, size: 20),
                                            onPressed: () => _showEditProfileDialog(context),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      if (controller.userEmail.value.isNotEmpty)
                                        Text(
                                          controller.userEmail.value,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white70,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'ID: ${controller.userIdValue.value}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.white70,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -20),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardTheme.color,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [AppColors.cardShadow],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _QuickActionCard(
                                icon: Icons.shopping_bag,
                                label: 'All Order',
                                onTap: () => Get.toNamed('/orders'),
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 60,
                              color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade200,
                            ),
                            Expanded(
                              child: _QuickActionCard(
                                icon: Icons.local_offer,
                                label: 'Voucher',
                                onTap: () => Get.toNamed('/vouchers'),
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 60,
                              color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade200,
                            ),
                            Expanded(
                              child: _QuickActionCard(
                                icon: Icons.location_on,
                                label: 'Address',
                                onTap: () => Get.toNamed('/addresses'),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardTheme.color,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [AppColors.cardShadow],
                        ),
                        child: Column(
                          children: [
                            _ProfileMenuItem(
                              icon: Icons.person,
                              title: 'My Profile',
                              iconColor: AppColors.primaryGreen,
                              onTap: () => _showEditProfileDialog(context),
                            ),
                            const Divider(height: 1),
                            _ProfileMenuItem(
                              icon: Icons.notifications,
                              title: 'Notification',
                              iconColor: AppColors.primaryGreen,
                              onTap: () => Get.toNamed('/notifications'),
                            ),
                            const Divider(height: 1),
                            _ProfileMenuItem(
                              icon: Icons.settings,
                              title: 'Theame',
                              iconColor: AppColors.primaryGreen,
                              onTap: () => _showThemeDialog(context),
                            ),
                            const Divider(height: 1),
                            _ProfileMenuItem(
                              icon: Icons.contact_support,
                              title: 'Contact Us',
                              iconColor: AppColors.primaryGreen,
                              onTap: () => Get.toNamed('/contact'),
                            ),
                            const Divider(height: 1),
                            _ProfileMenuItem(
                              icon: Icons.privacy_tip,
                              title: 'Privacy Policy',
                              iconColor: AppColors.primaryGreen,
                              onTap: () => Get.toNamed('/privacyPolicy'),
                            ),
                            const Divider(height: 1),
                            _ProfileMenuItem(
                              icon: Icons.logout,
                              title: 'Logout',
                              iconColor: Colors.red,
                              onTap: () => _showLogoutConfirmation(context),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      }),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.primaryGreen, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).textTheme.bodyMedium?.color ?? AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color iconColor;
  final VoidCallback onTap;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: title == 'Logout' ? Colors.red : (Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary),
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[600] : Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}
