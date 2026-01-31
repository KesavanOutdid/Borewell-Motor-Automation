import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'services/token_service.dart';
import 'services/permission_service.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> {
  final PermissionService _permissionService = PermissionService();

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await Future.delayed(const Duration(seconds: 2));
    
    await _requestPermissions();
    
    await _checkLoginStatus();
  }

  Future<void> _requestPermissions() async {
    try {
      await _permissionService.requestAllPermissions();
    } catch (e) {
      print('Error requesting permissions: $e');
    }
  }

  Future<void> _checkLoginStatus() async {
    final tokenService = Get.find<TokenService>();
    final token = tokenService.getToken();
    
    if (token != null && token.isNotEmpty) {
      Get.offAllNamed('/home');
    } else {
      Get.offAllNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/image.png',
                width: 150,
                height: 150,
                errorBuilder: (context, error, stackTrace) {
                  return const FlutterLogo(size: 150);
                },
              ),
              const SizedBox(height: 30),
              const Text(
                'AgriPlus',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Borewell Motor Automation',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
