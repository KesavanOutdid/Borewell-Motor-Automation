import 'package:get/get.dart';
import '../controllers/auth_controller.dart';

class LoginBinding extends Bindings {
  @override
  void dependencies() {
    Get.delete<LoginController>(force: true);
    Get.put<LoginController>(LoginController());
  }
}
