import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/auth_controller.dart';
import '../../../../../core/routes/app_routes.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';

class LoginView extends GetView<LoginController> {
  LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final bool isSmallScreen = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: Container(
        width: double.infinity,
        height: MediaQuery.of(context).size.height,
        decoration: const BoxDecoration(
          gradient: AppColors.primaryGradient,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height - 
                    MediaQuery.of(context).padding.top - 
                    MediaQuery.of(context).padding.bottom,
              ),
              child: IntrinsicHeight(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: isSmallScreen
                        ? const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [_Logo(), SizedBox(height: 40), _FormContent()],
                          )
                        : Container(
                            padding: const EdgeInsets.all(32.0),
                            constraints: const BoxConstraints(maxWidth: 800),
                            child: const Row(
                              children: [
                                Expanded(child: _Logo()),
                                Expanded(child: Center(child: _FormContent())),
                              ],
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  const _Logo();

  @override
  Widget build(BuildContext context) {
    final bool isSmallScreen = MediaQuery.of(context).size.width < 600;
    final logoSize = isSmallScreen ? 100.0 : 200.0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: logoSize,
          height: logoSize,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Image.asset(
              'assets/images/image.png',
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.water_drop,
                  size: logoSize * 0.6,
                  color: AppColors.primaryGreen,
                );
              },
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(
            "Borewell Motor Automation",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: isSmallScreen ? 18 : 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              shadows: [
                Shadow(
                  color: Colors.black.withOpacity(0.3),
                  offset: const Offset(0, 2),
                  blurRadius: 4,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FormContent extends StatefulWidget {
  const _FormContent();

  @override
  State<_FormContent> createState() => _FormContentState();
}

class _FormContentState extends State<_FormContent> {
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  late TextEditingController emailController;
  late TextEditingController passwordController;
  late LoginController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.find<LoginController>();
    emailController = TextEditingController(text: controller.email.value);
    passwordController = TextEditingController();
    
    ever(controller.email, (email) {
      if (emailController.text != email) {
        emailController.text = email;
      }
    });
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(32),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 300),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Welcome Back',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryGreen,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Login to continue',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 32),
            TextFormField(
              controller: emailController,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter email';
                }
                bool emailValid = RegExp(
                  r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
                ).hasMatch(value);
                if (!emailValid) {
                  return 'Please enter valid email';
                }
                return null;
              },
              onChanged: (value) => controller.email.value = value,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'Enter your gmail',
                prefixIcon: Icon(Icons.email_outlined),
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
            const SizedBox(height: 16),
            Obx(
              () => TextField(
                controller: passwordController,
                maxLength: 6,
                keyboardType: TextInputType.number,
                obscureText: !controller.isPasswordVisible.value,
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: "Enter 6-digit PIN",
                  counterText: "",
                  border: const OutlineInputBorder(),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  suffixIcon: IconButton(
                    icon: Icon(
                      controller.isPasswordVisible.value
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      controller.isPasswordVisible.toggle();
                    },
                  ),
                ),
                onChanged: (value) {
                  controller.password.value = value;
                },
              ),
            ),
            const SizedBox(height: 32),
            Obx(() => GradientButton(
                  text: 'Login',
                  icon: Icons.login,
                  isLoading: controller.isLoading.value,
                  height: 56,
                  onPressed: () async {
                    if (formKey.currentState?.validate() ?? false) {
                      if (passwordController.text.length == 6) {
                        final errorMessage = await controller.login();
                        if (errorMessage != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(errorMessage),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          );
                        }
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text("Please enter 6-digit password"),
                            backgroundColor: AppColors.warning,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                      }
                    }
                  },
                )),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Get.toNamed(AppRoutes.signup),
              child: Text(
                "Don't have account? Signup",
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.w600,
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
