import 'package:flutter/material.dart';
import 'package:get/get.dart';

class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(30),
      ),
      child: PopupMenuButton<String>(
        icon: const Icon(Icons.language, color: Colors.white),
        position: PopupMenuPosition.under,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        offset: const Offset(0, 8),
        onSelected: (String code) {
          final parts = code.split('_');
          Get.updateLocale(Locale(parts[0], parts[1]));
        },
        itemBuilder: (BuildContext context) {
          return [
            PopupMenuItem(value: 'en_US', child: Text('english'.tr, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
            PopupMenuItem(value: 'te_IN', child: Text('telugu'.tr, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
            PopupMenuItem(value: 'ta_IN', child: Text('tamil'.tr, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
            PopupMenuItem(value: 'kn_IN', child: Text('kannada'.tr, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
            PopupMenuItem(value: 'ml_IN', child: Text('malayalam'.tr, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))),
          ];
        },
      ),
    );
  }
}
