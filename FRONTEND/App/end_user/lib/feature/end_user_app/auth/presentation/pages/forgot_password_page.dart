import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/forgot_password_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class ForgotPasswordView extends GetView<ForgotPasswordController> {
  ForgotPasswordView({super.key});

  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 40),
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(40),
                    bottomRight: Radius.circular(40),
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -50,
                      top: -50,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Column(
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                            onPressed: () => Get.back(),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.lock_reset_rounded,
                            size: 50,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'forgot_password_title'.tr,
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'enter_email_to_receive_reset_code'.tr,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 10),
                      Obx(() => TextFormField(
                        enabled: !controller.isOtpSent.value,
                        onChanged: (value) => controller.email.value = value,
                        keyboardType: TextInputType.emailAddress,
                        style: TextStyle(
                          fontSize: 16, 
                          fontWeight: FontWeight.w500,
                          color: controller.isOtpSent.value ? Colors.grey : Colors.black,
                        ),
                        decoration: InputDecoration(
                          labelText: "enter_email_label".tr,
                          labelStyle: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primaryGreen),
                          suffixIcon: controller.isOtpSent.value ? IconButton(
                            icon: const Icon(Icons.refresh, color: AppColors.primaryGreen),
                            onPressed: () => controller.resetState(),
                            tooltip: "change_email_tooltip".tr,
                          ) : null,
                          filled: true,
                          fillColor: controller.isOtpSent.value ? Colors.grey.shade50 : Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          disabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                            borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return "please_enter_email".tr;
                          if (!controller.isValidEmail(value)) return "invalid_email".tr;
                          return null;
                        },
                      )),
                      const SizedBox(height: 32),
                      
                      Obx(() => SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: (controller.isLoading.value || controller.email.value.isEmpty)
                              ? null
                              : () => controller.sendOtp(),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey.shade200,
                            disabledForegroundColor: Colors.grey.shade500,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(28),
                            ),
                            elevation: 0,
                            shadowColor: Colors.transparent,
                            padding: EdgeInsets.zero,
                          ),
                          child: Ink(
                            decoration: BoxDecoration(
                              gradient: (controller.isLoading.value || controller.email.value.isEmpty)
                                  ? null
                                  : AppColors.primaryGradient,
                              color: (controller.isLoading.value || controller.email.value.isEmpty)
                                  ? Colors.grey.shade200
                                  : null,
                              borderRadius: BorderRadius.circular(28),
                              boxShadow: (controller.isLoading.value || controller.email.value.isEmpty)
                                  ? null
                                  : [
                                      BoxShadow(
                                        color: AppColors.primaryGreen.withOpacity(0.4),
                                        blurRadius: 16,
                                        offset: const Offset(0, 6),
                                        spreadRadius: -2,
                                      ),
                                    ],
                            ),
                            child: Container(
                              alignment: Alignment.center,
                              height: 56,
                              child: controller.isLoading.value
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  'send_otp'.tr,
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1,
                                    color: (controller.isLoading.value || controller.email.value.isEmpty)
                                        ? Colors.grey.shade500
                                        : Colors.white,
                                  ),
                                ),
                            ),
                          ),
                        ),
                      )),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
