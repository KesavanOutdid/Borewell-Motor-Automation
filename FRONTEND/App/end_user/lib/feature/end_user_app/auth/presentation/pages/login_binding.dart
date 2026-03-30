import 'package:get/get.dart';

class LoginBinding extends Bindings {
  @override
  void dependencies() {
    // AuthController is already permanent and initialized in main.dart
    // No need to delete or recreate it
  }
}
