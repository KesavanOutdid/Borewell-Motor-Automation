import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/dashboard_controller.dart';
import '../../../home/presentation/pages/home_page.dart';
import '../../../shop/presentation/pages/shop_home_page.dart';
import '../../../profile/presentation/pages/profile_page.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Scaffold(
        body: _buildPage(controller.selectedIndex.value),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: controller.selectedIndex.value,
          onTap: (index) => controller.changePage(index),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.store),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.devices),
              label: 'My Devices',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
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
        return const ProfileView();
      default:
        return const ShopHomeView();
    }
  }
}
