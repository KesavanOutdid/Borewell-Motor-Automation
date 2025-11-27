import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class ThemeController extends GetxController {
  static const String _themeKey = 'theme_mode';
  final _storage = GetStorage();
  
  final Rx<ThemeMode> _themeMode = ThemeMode.light.obs;
  
  ThemeMode get themeMode => _themeMode.value;
  
  @override
  void onInit() {
    super.onInit();
    _loadTheme();
  }
  
  void _loadTheme() {
    final savedTheme = _storage.read(_themeKey);
    if (savedTheme != null) {
      _themeMode.value = ThemeMode.values[savedTheme];
    }
  }
  
  void setTheme(ThemeMode mode) {
    _themeMode.value = mode;
    _storage.write(_themeKey, mode.index);
    Get.changeThemeMode(mode);
  }
  
  void setLight() => setTheme(ThemeMode.light);
  void setDark() => setTheme(ThemeMode.dark);
  void setSystem() => setTheme(ThemeMode.system);
}
