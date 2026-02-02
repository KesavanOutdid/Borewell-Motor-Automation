import 'package:get/get.dart';

class DashboardController extends GetxController {
  var selectedIndex = 1.obs;

  void changePage(int index) {
    selectedIndex.value = index;
  }

  String getPageTitle(int index) {
    switch (index) {
      case 0:
        return 'Home';
      case 1:
        return 'Devices';
      case 2:
        return 'Contact';
      case 3:
        return 'Profile';
      default:
        return 'Home';
    }
  }
}
