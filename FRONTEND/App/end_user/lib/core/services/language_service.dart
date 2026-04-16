import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class LanguageService extends GetxService {
  static const String _languageKey = 'app_language';
  final _storage = GetStorage();

  Future<LanguageService> init() async {
    return this;
  }

  Locale getLocale() {
    final langCode = _storage.read<String>(_languageKey);
    print('🌐 [LanguageService] Loading locale: $langCode');
    if (langCode != null) {
      final parts = langCode.split('_');
      if (parts.length == 2) {
        return Locale(parts[0], parts[1]);
      } else {
        return Locale(langCode);
      }
    }
    return Get.deviceLocale ?? const Locale('en', 'US');
  }

  Future<void> updateLocale(String langCode) async {
    final parts = langCode.split('_');
    if (parts.length == 2) {
      print('🌐 [LanguageService] Updating locale to: $langCode');
      await Get.updateLocale(Locale(parts[0], parts[1]));
      await _storage.write(_languageKey, langCode);
    }
  }

  String getLanguageCode() {
    return _storage.read<String>(_languageKey) ?? 'en_US';
  }
}
