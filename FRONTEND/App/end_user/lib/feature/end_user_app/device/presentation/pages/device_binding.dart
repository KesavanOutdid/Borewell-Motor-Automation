import 'package:get/get.dart';
import '../controllers/device_controller.dart';
import '../controllers/device_details_controller.dart';
import '../../../auth/presentation/pages/login_binding.dart';

class DeviceBinding extends Bindings {
  @override
  void dependencies() {
    LoginBinding().dependencies();
    Get.lazyPut<DeviceController>(() => DeviceController());
  }
}

class DeviceDetailsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DeviceDetailsController>(() => DeviceDetailsController());
  }
}
