import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/dashboard_controller.dart';
import '../../../home/presentation/pages/home_page.dart';
import '../../../shop/presentation/pages/shop_home_page.dart';
import '../../../shop/presentation/pages/cart_page.dart';
import '../../../shop/presentation/pages/orders_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';
import '../../../../../utils/theme/app_colors.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Scaffold(
        body: _buildPage(controller.selectedIndex.value),
        bottomNavigationBar: BottomAppBar(
          shape: const CircularNotchedRectangle(),
          notchMargin: 6,
          color: Theme.of(context).bottomNavigationBarTheme.backgroundColor,
          elevation: 8,
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavBarItem(
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home,
                  label: 'Home',
                  isSelected: controller.selectedIndex.value == 0,
                  onTap: () => controller.changePage(0),
                ),
                _NavBarItem(
                  icon: Icons.devices_outlined,
                  activeIcon: Icons.devices,
                  label: 'Devices',
                  isSelected: controller.selectedIndex.value == 1,
                  onTap: () => controller.changePage(1),
                ),
                const SizedBox(width: 50),
                _NavBarItem(
                  icon: Icons.shopping_bag_outlined,
                  activeIcon: Icons.shopping_bag,
                  label: 'Orders',
                  isSelected: controller.selectedIndex.value == 2,
                  onTap: () => controller.changePage(2),
                ),
                _NavBarItem(
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  label: 'Profile',
                  isSelected: controller.selectedIndex.value == 3,
                  onTap: () => controller.changePage(3),
                ),
              ],
            ),
          ),
        ),
        floatingActionButton: Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: FloatingActionButton(
              heroTag: 'dashboard_cart_fab',
              onPressed: () => Get.to(() => const CartPage()),
              backgroundColor: Colors.transparent,
              elevation: 0,
              child: const Icon(
                Icons.shopping_cart,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      ),
    );
  }

  Widget _buildPage(int index) {
    switch (index) {
      case 0:
        return const ShopHomeView();
      case 1:
        return HomeView();
      case 2:
        return const OrdersPage();
      case 3:
        return const ProfileView();
      default:
        return const ShopHomeView();
    }
  }
}

class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? AppColors.primaryGreen : AppColors.textMuted,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? AppColors.primaryGreen : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
