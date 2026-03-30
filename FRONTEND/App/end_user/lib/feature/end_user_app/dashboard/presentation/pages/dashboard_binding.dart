import 'package:get/get.dart';
import '../controllers/dashboard_controller.dart';
import '../../../home/presentation/pages/home_binding.dart';
import '../../../device/presentation/pages/device_binding.dart';
import '../../../profile/presentation/pages/profile_binding.dart';
import '../../../auth/presentation/pages/login_binding.dart';
import '../../../shop/presentation/controllers/cart_controller.dart';
import '../../../shop/presentation/controllers/shop_controller.dart';
import '../../../shop/presentation/controllers/voucher_controller.dart';

class DashboardBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(DashboardController());
    Get.put(ShopController());
    Get.put(CartController());
    Get.put(VoucherController());
    LoginBinding().dependencies();
    HomeBinding().dependencies();
    DeviceBinding().dependencies();
    ProfileBinding().dependencies();
  }
}
