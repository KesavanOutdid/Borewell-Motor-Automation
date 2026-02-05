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
    return await showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit App'),
            content: const Text('Are you sure you want to exit?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('No'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Yes'),
              ),
            ],
          ),
        ) ??
        false;
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
      width: MediaQuery.of(context).size.width * 0.7,
      child: Drawer(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 24),
              Image.asset(
                'assets/images/image.png',
                height: 80,
              ),
              const Text(
                'AgriPlus',
                style: TextStyle(
                  color: AppColors.primaryGreen,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              Obx(() => Container(
                margin: const EdgeInsets.symmetric(horizontal: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1),
                      ),
                      child: ClipOval(
                        child: profileController.userProfileImage.value.isNotEmpty
                            ? Image.network(
                                "${AppConfig.baseUrl}${profileController.userProfileImage.value}",
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => 
                                  const Icon(Icons.person, color: Colors.white, size: 30),
                              )
                            : const Icon(Icons.person, color: Colors.white, size: 30),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profileController.userName.value.isNotEmpty 
                                ? profileController.userName.value 
                                : 'AgriPlus',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (profileController.userPhone.value.isNotEmpty)
                            Text(
                              "+91 ${profileController.userPhone.value}",
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              )),
              const SizedBox(height: 32),
              Expanded(
                child: Obx(
                  () => ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    children: [
                      _DrawerItem(
                        icon: Icons.home_rounded,
                        label: 'Home',
                        isSelected: controller.selectedIndex.value == 0,
                        onTap: () {
                          controller.changePage(0);
                          Navigator.of(context).pop();
                        },
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(height: 8),
                      _DrawerItem(
                        icon: Icons.store_rounded,
                        label: 'Shop',
                        isSelected: controller.selectedIndex.value == 1,
                        onTap: () {
                          controller.changePage(1);
                          Navigator.of(context).pop();
                        },
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(height: 8),
                      _DrawerItem(
                        icon: Icons.shopping_bag_rounded,
                        label: 'Orders',
                        isSelected: controller.selectedIndex.value == 2,
                        onTap: () {
                          controller.changePage(2);
                          Navigator.of(context).pop();
                        },
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(height: 8),
                      _DrawerItem(
                        icon: Icons.person_rounded,
                        label: 'Profile',
                        isSelected: controller.selectedIndex.value == 3,
                        onTap: () {
                          controller.changePage(3);
                          Navigator.of(context).pop();
                        },
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(height: 24),
                      const Divider(),
                      const SizedBox(height: 8),
                      _DrawerItem(
                        icon: Icons.info_outline_rounded,
                        label: 'About AgriPlus',
                        isSelected: false,
                        onTap: () {
                          Navigator.of(context).pop();
                          Get.to(() => const AboutAgriPlusPage());
                        },
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(height: 8),
                      _DrawerItem(
                        icon: Icons.logout_rounded,
                        label: 'Logout',
                        isSelected: false,
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

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? color : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.02)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppColors.textSecondary),
              size: 26,
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? Colors.white : (isDark ? Colors.white : AppColors.textPrimary),
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
