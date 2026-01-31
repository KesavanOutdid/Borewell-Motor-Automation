import 'package:get/get.dart';
import '../controllers/device_sharing_controller.dart';

class DeviceSharingBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DeviceSharingController>(() => DeviceSharingController());
  }
}
