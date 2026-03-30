import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../controllers/dashboard_controller.dart';
import '../../../home/presentation/pages/home_page.dart';
import '../../../home/presentation/controllers/home_controller.dart';
import '../../../shop/presentation/pages/shop_home_page.dart';
import '../../../shop/presentation/pages/cart_page.dart';
import '../../../shop/presentation/pages/orders_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import 'about_agriplus_page.dart';
import '../../../profile/presentation/controllers/profile_controller.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../../../core/config/env.dart';
import '../../../../../utils/theme/app_colors.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  Future<bool> _showExitDialog(BuildContext context) async {
    final result = await Get.dialog<bool>(
      AlertDialog(
        title: Text('exit_app'.tr),
        content: Text('exit_confirmation'.tr),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context, rootNavigator: true).pop(false),
            child: Text('no'.tr),
          ),
          TextButton(
            onPressed: () => Navigator.of(context, rootNavigator: true).pop(true),
            child: Text('yes'.tr),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        // If not on Home page (index 0), go to Home first
        if (controller.selectedIndex.value != 0) {
          controller.changePage(0);
          return;
        }

        // If already on Home, show exit confirmation
        final shouldPop = await _showExitDialog(context);
        if (shouldPop) {
          SystemChannels.platform.invokeMethod('SystemNavigator.pop');
        }
      },
      child: Obx(
        () => Scaffold(
          drawer: _ModernDrawer(controller: controller),
          body: Stack(
            children: [
              _buildPage(controller.selectedIndex.value),
              if (controller.selectedIndex.value == 1 ||
                  controller.selectedIndex.value == 2)
                Positioned(
                  right: 16,
                  bottom: 24,
                  child: _FloatingCartButton(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPage(int index) {
    switch (index) {
      case 0:
        return HomeView();
      case 1:
        return const ShopHomeView();
      case 2:
        return const OrdersPage();
      case 3:
        return const ProfileView();
      default:
        return HomeView();
    }
  }
}

class _ModernDrawer extends StatelessWidget {
  final DashboardController controller;
  
  const _ModernDrawer({required this.controller});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final profileController = Get.find<ProfileController>();
    
    return SizedBox(
      width: MediaQuery.of(context).size.width * 0.75,
      child: Drawer(
        backgroundColor: isDark ? AppColors.backgroundDark : Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Header: Logo + Profile ──
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Image.asset(
                          'assets/images/image.png',
                          errorBuilder: (_, __, ___) =>
                              const Icon(Icons.water_drop, color: AppColors.primaryGreen, size: 24),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'AgriPlus',
                      style: TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // ── Profile Card ──
              Obx(() => Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF059669), Color(0xFF10B981)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withOpacity(0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                      spreadRadius: -2,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: profileController.userProfileImage.value.isNotEmpty
                            ? Image.network(
                                "${AppConfig.baseUrl}${profileController.userProfileImage.value}",
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => 
                                  Container(
                                    color: Colors.white24,
                                    child: const Icon(Icons.person, color: Colors.white, size: 28),
                                  ),
                              )
                            : Container(
                                color: Colors.white24,
                                child: const Icon(Icons.person, color: Colors.white, size: 28),
                              ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profileController.userName.value.isNotEmpty 
                                ? profileController.userName.value 
                                : 'agriplus_user'.tr,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          if (profileController.userPhone.value.isNotEmpty)
                            Row(
                              children: [
                                Icon(Icons.phone_rounded, size: 12, color: Colors.white.withOpacity(0.7)),
                                const SizedBox(width: 4),
                                Text(
                                  "+91 ${profileController.userPhone.value}",
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: Colors.white.withOpacity(0.5), size: 22),
                  ],
                ),
              )),

              const SizedBox(height: 28),

              // ── Section Label ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'menu'.tr,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                      color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // ── Menu Items ──
              Expanded(
                child: Obx(
                  () => ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      _DrawerItem(
                        icon: Icons.home_rounded,
                        label: 'home'.tr,
                        isSelected: controller.selectedIndex.value == 0,
                        onTap: () {
                          controller.changePage(0);
                          Navigator.of(context).pop();
                        },
                        color: const Color(0xFF059669),
                      ),
                      const SizedBox(height: 4),
                      _DrawerItem(
                        icon: Icons.store_rounded,
                        label: 'shop'.tr,
                        isSelected: controller.selectedIndex.value == 1,
                        onTap: () {
                          controller.changePage(1);
                          Navigator.of(context).pop();
                        },
                        color: const Color(0xFF3B82F6),
                      ),
                      const SizedBox(height: 4),
                      _DrawerItem(
                        icon: Icons.shopping_bag_rounded,
                        label: 'orders'.tr,
                        isSelected: controller.selectedIndex.value == 2,
                        onTap: () {
                          controller.changePage(2);
                          Navigator.of(context).pop();
                        },
                        color: const Color(0xFFFF8A00),
                      ),
                      const SizedBox(height: 4),
                      _DrawerItem(
                        icon: Icons.person_rounded,
                        label: 'profile'.tr,
                        isSelected: controller.selectedIndex.value == 3,
                        onTap: () {
                          controller.changePage(3);
                          Navigator.of(context).pop();
                        },
                        color: const Color(0xFF9D4EDD),
                      ),
                      const SizedBox(height: 16),

                      // ── Section Divider ──
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          children: [
                            Expanded(child: Divider(color: isDark ? Colors.grey.shade700 : Colors.grey.shade200)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'more'.tr,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.5,
                                  color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                                ),
                              ),
                            ),
                            Expanded(child: Divider(color: isDark ? Colors.grey.shade700 : Colors.grey.shade200)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      _DrawerItem(
                        icon: Icons.info_outline_rounded,
                        label: 'about_agriplus'.tr,
                        isSelected: false,
                        onTap: () {
                          Navigator.of(context).pop();
                          Get.to(() => const AboutAgriPlusPage());
                        },
                        color: const Color(0xFF14B8A6),
                      ),
                      const SizedBox(height: 4),
                      _DrawerItem(
                        icon: Icons.help_outline_rounded,
                        label: 'help_support'.tr,
                        isSelected: false,
                        onTap: () {
                          Navigator.of(context).pop();
                          Get.toNamed('/help');
                        },
                        color: Colors.blue,
                      ),
                      const SizedBox(height: 4),
                      _DrawerItem(
                        icon: Icons.logout_rounded,
                        label: 'logout'.tr,
                        isSelected: false,
                        isDestructive: true,
                        onTap: () async {
                          Navigator.of(context).pop();
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
                        color: AppColors.error,
                      ),
                    ],
                  ),
                ),
              ),

              // ── Bottom: Version ──
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                child: Column(
                  children: [
                    Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                    const SizedBox(height: 8),
                    Text(
                      'smart_motor_automation'.tr,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.grey.shade600 : Colors.grey.shade400,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'v1.0.0',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.grey.shade700 : Colors.grey.shade400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color color;
  final bool isDestructive;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.color,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withOpacity(0.1)
              : (isDestructive
                  ? AppColors.error.withOpacity(0.04)
                  : Colors.transparent),
          borderRadius: BorderRadius.circular(14),
          border: isDestructive && !isSelected
              ? Border.all(color: AppColors.error.withOpacity(0.15))
              : null,
        ),
        child: Row(
          children: [
            // Left accent bar for selected
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 4,
              height: isSelected ? 28 : 0,
              decoration: BoxDecoration(
                color: isSelected ? color : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            SizedBox(width: isSelected ? 12 : 0),
            // Icon with tinted background
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: isSelected
                    ? color.withOpacity(0.15)
                    : (isDark ? Colors.white.withOpacity(0.06) : color.withOpacity(0.08)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? color : (isDark ? Colors.white70 : color.withOpacity(0.7)),
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isDestructive
                      ? AppColors.error
                      : (isSelected
                          ? (isDark ? Colors.white : AppColors.textPrimary)
                          : (isDark ? Colors.white70 : AppColors.textSecondary)),
                  letterSpacing: -0.2,
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
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.4),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _FloatingMenuButton extends StatelessWidget {
  final bool isDark;
  
  const _FloatingMenuButton({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Scaffold.of(context).openDrawer(),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(
          Icons.menu_rounded,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}

class _FloatingCartButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Get.to(() => const CartPage()),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primaryOrange,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(
          Icons.shopping_cart_rounded,
          color: Colors.white,
          size: 28,
        ),
      ),
    );
  }
}
