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
                  color: AppColors.primaryGreen,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(40),
                    bottomRight: Radius.circular(40),
                  ),
                ),
                child: Column(
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Get.back(),
                      ),
                    ),
                    const Icon(
                      Icons.lock_reset,
                      size: 80,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      "Forgot Password",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
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
                          labelText: "Enter Email",
                          labelStyle: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                          prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primaryGreen),
                          suffixIcon: controller.isOtpSent.value ? IconButton(
                            icon: const Icon(Icons.refresh, color: AppColors.primaryGreen),
                            onPressed: () => controller.resetState(),
                            tooltip: "Change Email",
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
                          if (value == null || value.isEmpty) return "Please enter email";
                          if (!controller.isValidEmail(value)) return "Please enter a valid email";
                          return null;
                        },
                      )),
                      const SizedBox(height: 24),
                      
                      Obx(() => SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: (controller.isLoading.value || controller.email.value.isEmpty)
                              ? null
                              : () => controller.sendOtp(),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey.shade200,
                            disabledForegroundColor: Colors.grey.shade500,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                            elevation: 0,
                          ),
                          child: controller.isLoading.value
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text(
                                  "Send OTP",
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
