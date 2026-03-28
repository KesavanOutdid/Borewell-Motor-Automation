import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/routes/app_routes.dart';
import '../../../../../utils/theme/app_colors.dart';

class LanguageSelectionPage extends StatelessWidget {
  LanguageSelectionPage({super.key});

  final RxString selectedLang = 'en_US'.obs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Text('choose_language'.tr),
        automaticallyImplyLeading: false, // Don't let them go back to login easily
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Icon(Icons.language, size: 80, color: AppColors.primaryGreen),
              const SizedBox(height: 40),
              Expanded(
                child: Obx(() {
                  final currentLang = selectedLang.value;
                  
                  // Compute inside Obx so that translations and list update properly
                  final List<Map<String, String>> languages = [
                    {'code': 'en_US', 'name': 'english'.tr},
                    {'code': 'te_IN', 'name': 'telugu'.tr},
                    {'code': 'ta_IN', 'name': 'tamil'.tr},
                    {'code': 'kn_IN', 'name': 'kannada'.tr},
                    {'code': 'ml_IN', 'name': 'malayalam'.tr},
                  ];

                  return ListView.separated(
                    itemCount: languages.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final lang = languages[index];
                      final isSelected = currentLang == lang['code'];
                      
                      return InkWell(
                        onTap: () {
                          selectedLang.value = lang['code']!;
                          final parts = lang['code']!.split('_');
                          Get.updateLocale(Locale(parts[0], parts[1]));
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primaryGreen.withOpacity(0.1) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? AppColors.primaryGreen : Colors.grey.shade300,
                              width: 2,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  lang['name']!,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? AppColors.primaryGreen : Colors.black87,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                const Icon(Icons.check_circle, color: AppColors.primaryGreen)
                            ],
                          ),
                        ),
                      );
                    },
                  );
                }),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  // After selecting, go to Main/Home view
                  Get.offAllNamed(AppRoutes.home);
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  backgroundColor: AppColors.primaryGreen,
                ),
                child: Obx(() {
                  // Listen to locale changes here if needed, or simply let GetMaterialApp handle string change
                  // But since .tr is static at call time unless wrapped in reactive:
                  // Reading selectedLang.value forces a rebuild of this button too.
                  final _ = selectedLang.value; 
                  return Text(
                     'continue'.tr,
                     style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                  );
                }),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
