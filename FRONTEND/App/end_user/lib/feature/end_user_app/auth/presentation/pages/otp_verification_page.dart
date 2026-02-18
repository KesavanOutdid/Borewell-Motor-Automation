import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter/services.dart';
import '../controllers/forgot_password_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class OtpVerificationView extends GetView<ForgotPasswordController> {
  OtpVerificationView({super.key});

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
                      Icons.mark_email_read_outlined,
                      size: 80,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      "Verify OTP",
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
                      const SizedBox(height: 20),
                      Text(
                        "Verify your email",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Enter the 4-digit code sent to ${controller.email.value}",
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 40),
                      
                      _OtpInput(
                        onChanged: (value) => controller.otp.value = value,
                      ),
                      
                      const SizedBox(height: 16),
                      
                      Obx(() => Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: controller.timerSeconds.value > 0
                              ? null
                              : () => controller.sendOtp(),
                          child: Text(
                            controller.timerSeconds.value > 0
                                ? "Resend OTP in ${controller.timerSeconds.value}s"
                                : "Resend OTP",
                            style: TextStyle(
                              color: controller.timerSeconds.value > 0
                                  ? Colors.grey
                                  : AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      )),
                      
                      const SizedBox(height: 40),
                      
                      Obx(() => SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: (controller.isLoading.value || controller.otp.value.length < 4)
                              ? null 
                              : () {
                                  if (_formKey.currentState?.validate() ?? false) {
                                    controller.verifyOtp();
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey.shade200,
                            disabledForegroundColor: Colors.grey.shade500,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                            elevation: controller.otp.value.length < 4 ? 0 : 4,
                            shadowColor: AppColors.primaryGreen.withOpacity(0.3),
                          ),
                          child: controller.isLoading.value
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text(
                                  "Verify & Continue",
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

class _OtpInput extends StatefulWidget {
  final Function(String) onChanged;

  const _OtpInput({required this.onChanged});

  @override
  State<_OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<_OtpInput> {
  final List<TextEditingController> _controllers = List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _onChanged() {
    String otp = _controllers.map((c) => c.text).join();
    widget.onChanged(otp);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0),
          child: SizedBox(
            width: 55,
            height: 60,
            child: KeyboardListener(
              focusNode: FocusNode(),
              onKeyEvent: (event) {
                if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
                  if (_controllers[index].text.isEmpty && index > 0) {
                    _focusNodes[index - 1].requestFocus();
                  }
                }
              },
              child: TextFormField(
                controller: _controllers[index],
                focusNode: _focusNodes[index],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                decoration: InputDecoration(
                  counterText: "",
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  contentPadding: EdgeInsets.zero,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                  ),
                ),
                onChanged: (value) {
                  if (value.isNotEmpty) {
                    if (index < 3) {
                      _focusNodes[index + 1].requestFocus();
                    } else {
                      _focusNodes[index].unfocus();
                    }
                  }
                  _onChanged();
                },
              ),
            ),
          ),
        );
      }),
    );
  }
}
