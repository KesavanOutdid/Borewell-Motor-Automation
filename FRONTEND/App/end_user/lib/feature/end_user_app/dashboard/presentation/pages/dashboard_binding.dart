import 'package:get/get.dart';
import '../controllers/dashboard_controller.dart';
import '../../../home/presentation/pages/home_binding.dart';
import '../../../device/presentation/pages/device_binding.dart';
import '../../../profile/presentation/pages/profile_binding.dart';
import '../../../auth/presentation/pages/login_binding.dart';

class DashboardBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(DashboardController());
    LoginBinding().dependencies();
    HomeBinding().dependencies();
    DeviceBinding().dependencies();
    ProfileBinding().dependencies();
  }
}
