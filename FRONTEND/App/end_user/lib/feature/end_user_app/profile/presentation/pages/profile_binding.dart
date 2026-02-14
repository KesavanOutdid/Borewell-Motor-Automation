import 'package:get/get.dart';
import '../controllers/profile_controller.dart';
import '../../../auth/presentation/pages/login_binding.dart';

class ProfileBinding extends Bindings {
  @override
  void dependencies() {
    LoginBinding().dependencies();
    Get.lazyPut<ProfileController>(() => ProfileController());
  }
}
