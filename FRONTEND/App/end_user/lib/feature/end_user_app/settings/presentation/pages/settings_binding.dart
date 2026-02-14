import 'package:get/get.dart';
import '../../../../../utils/theme/theme_controller.dart';

class SettingsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ThemeController>(() => ThemeController());
  }
}
