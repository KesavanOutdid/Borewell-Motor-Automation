import 'package:get/get.dart';
import '../../../shop/presentation/controllers/shop_controller.dart';

class DashboardController extends GetxController {
  var selectedIndex = 0.obs;

  @override
  void onInit() {
    super.onInit();
    if (Get.arguments != null && Get.arguments is Map && Get.arguments['index'] != null) {
      selectedIndex.value = Get.arguments['index'];
      if (selectedIndex.value == 1) {
        _triggerShopShuffle();
      }
    }
  }

  void changePage(int index) {
    if (selectedIndex.value != index && index == 1) {
      _triggerShopShuffle();
    }
    selectedIndex.value = index;
  }

  void _triggerShopShuffle() {
    try {
      if (Get.isRegistered<ShopController>()) {
        Get.find<ShopController>().setShouldShuffleOnNextDisplay();
      }
    } catch (e) {
      // ShopController might not be initialized yet
    }
  }

  String getPageTitle(int index) {
    switch (index) {
      case 0:
        return 'Devices';
      case 1:
        return 'Shop';
      case 2:
        return 'Orders';
      case 3:
        return 'Profile';
      default:
        return 'Devices';
    }
  }
}
