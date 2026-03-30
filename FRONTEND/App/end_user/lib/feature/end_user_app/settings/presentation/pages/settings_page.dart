import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import '../../../../../utils/theme/theme_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  void _showThemeDialog(BuildContext context) {
    final themeController = Get.find<ThemeController>();
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text('choose_theme'.tr, style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildThemeOption(
                context,
                icon: Icons.light_mode_rounded,
                label: 'light'.tr,
                color: const Color(0xFFFF8A00),
                isSelected: themeController.themeMode == ThemeMode.light,
                onTap: () {
                  themeController.setLight();
                  Navigator.pop(context);
                },
              ),
              SizedBox(height: 8),
              _buildThemeOption(
                context,
                icon: Icons.dark_mode_rounded,
                label: 'dark'.tr,
                color: const Color(0xFF6366F1),
                isSelected: themeController.themeMode == ThemeMode.dark,
                onTap: () {
                  themeController.setDark();
                  Navigator.pop(context);
                },
              ),
              SizedBox(height: 8),
              _buildThemeOption(
                context,
                icon: Icons.brightness_auto_rounded,
                label: 'system_default'.tr,
                color: AppColors.primaryGreen,
                isSelected: themeController.themeMode == ThemeMode.system,
                onTap: () {
                  themeController.setSystem();
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildThemeOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: isSelected ? Border.all(color: color.withOpacity(0.3)) : null,
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected ? color : null,
                ),
              ),
            ),
            if (isSelected)
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: color.withOpacity(0.4), blurRadius: 6)],
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).dialogTheme.backgroundColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text('logout'.tr, style: TextStyle(fontWeight: FontWeight.w800)),
          content: Text('logout_confirmation'.tr),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text('no'.tr),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  final authController = Get.find<AuthController>();
                  await authController.logout();
                  
                  Get.delete<HomeController>();
                } catch (e) {
                  print('Logout error: $e');
                }
                
                await Future.delayed(const Duration(milliseconds: 200));
                Get.offAllNamed('/login');
              },
              child: Text('yes'.tr,
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('settings'.tr, style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Section: Display
          Text(
            'DISPLAY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
            ),
          ),
          SizedBox(height: 12),
          _SettingsTile(
            icon: Icons.palette_rounded,
            label: 'theme'.tr,
            subtitle: 'theme_subtitle'.tr,
            color: const Color(0xFF6366F1),
            onTap: () => _showThemeDialog(context),
            isDark: isDark,
          ),

          SizedBox(height: 28),

          // Section: Legal
          Text(
            'LEGAL',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
            ),
          ),
          SizedBox(height: 12),
          _SettingsTile(
            icon: Icons.shield_rounded,
            label: 'privacy_policy'.tr,
            color: const Color(0xFF9D4EDD),
            onTap: () {},
            isDark: isDark,
          ),
          SizedBox(height: 12),
          _SettingsTile(
            icon: Icons.help_outline_rounded,
            label: 'help_support'.tr,
            color: Colors.blue,
            onTap: () => Get.toNamed('/help'),
            isDark: isDark,
          ),

          SizedBox(height: 28),

          // Section: Account
          Text(
            'ACCOUNT',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
            ),
          ),
          SizedBox(height: 12),
          _SettingsTile(
            icon: Icons.logout_rounded,
            label: 'logout'.tr,
            color: Colors.redAccent,
            isDestructive: true,
            onTap: () => _showLogoutConfirmation(context),
            isDark: isDark,
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Color color;
  final VoidCallback onTap;
  final bool isDark;
  final bool isDestructive;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.color,
    required this.onTap,
    required this.isDark,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDestructive
              ? Colors.redAccent.withOpacity(0.2)
              : (isDark ? Colors.grey.shade800 : Colors.grey.shade100),
        ),
        boxShadow: isDestructive
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDestructive
                              ? Colors.redAccent
                              : (isDark ? Colors.white : AppColors.textPrimary),
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (subtitle != null)
                        Text(
                          subtitle!,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.grey.shade500 : Colors.grey.shade500,
                          ),
                        ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 22,
                  color: isDark ? Colors.grey[600] : Colors.grey[400],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
