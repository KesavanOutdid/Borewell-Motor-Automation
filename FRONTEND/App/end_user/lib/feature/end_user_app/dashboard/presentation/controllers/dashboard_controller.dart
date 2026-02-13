import 'package:get/get.dart';

class DashboardController extends GetxController {
  var selectedIndex = 0.obs;

  @override
  void onInit() {
    super.onInit();
    if (Get.arguments != null && Get.arguments is Map && Get.arguments['index'] != null) {
      selectedIndex.value = Get.arguments['index'];
    }
  }

  void changePage(int index) {
    selectedIndex.value = index;
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
