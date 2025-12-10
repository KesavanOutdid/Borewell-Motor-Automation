import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../data/models/voucher_model.dart';

class VoucherController extends GetxController {
  final TokenService tokenService = Get.find<TokenService>();
  
  final vouchers = <VoucherModel>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;
  
  final currentPage = 1.obs;
  final totalPages = 1.obs;
  final totalVouchers = 0.obs;
  final totalActiveVouchers = 0.obs;

  @override
  void onInit() {
    super.onInit();
    fetchVouchers();
  }

  Future<void> fetchVouchers({int page = 1, int limit = 10}) async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final token = await tokenService.getToken();
      if (token == null) {
        Get.offAllNamed('/login');
        return;
      }

      final url = Uri.parse(
        '${AppConfig.baseUrl}${AppConfig.getAllVouchersEndpoint}?page=$page&limit=$limit',
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        
        if (jsonData['success'] == true) {
          final List<dynamic> voucherList = jsonData['data'] ?? [];
          vouchers.value = voucherList
              .map((json) => VoucherModel.fromJson(json))
              .where((voucher) => voucher.isActive)
              .toList();

          if (jsonData['pagination'] != null) {
            final pagination = VoucherPagination.fromJson(jsonData['pagination']);
            currentPage.value = pagination.currentPage;
            totalPages.value = pagination.totalPages;
            totalVouchers.value = pagination.totalVouchers;
            totalActiveVouchers.value = pagination.totalActiveVouchers;
          }
        }
      } else if (response.statusCode == 401) {
        Get.offAllNamed('/login');
      } else {
        errorMessage.value = 'Failed to load vouchers';
      }
    } catch (e) {
      errorMessage.value = 'Error: $e';
    } finally {
      isLoading.value = false;
    }
  }

  Future<ValidatedVoucher?> validateVoucher(String voucherCode) async {
    try {
      final token = await tokenService.getToken();
      if (token == null) {
        Get.offAllNamed('/login');
        return null;
      }

      final userId = tokenService.getUserId();
      final url = Uri.parse('${AppConfig.baseUrl}${AppConfig.validateVoucherEndpoint}');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'voucher_code': voucherCode,
        }),
      );

      await Future.delayed(const Duration(milliseconds: 300));

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        
        if (jsonData['success'] == true && jsonData['data'] != null) {
          final validatedVoucher = ValidatedVoucher.fromJson(jsonData['data']);
          Get.dialog(
            Builder(
              builder: (context) => AlertDialog(
                title: const Text('Success'),
                content: Text(jsonData['message'] ?? 'Voucher applied successfully'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('OK'),
                  ),
                ],
              ),
            ),
          );
          return validatedVoucher;
        }
      } else if (response.statusCode == 400) {
        final jsonData = jsonDecode(response.body);
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Invalid Voucher'),
              content: Text(jsonData['message'] ?? 'Voucher is invalid or expired'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      } else if (response.statusCode == 404) {
        Get.dialog(
          Builder(
            builder: (context) => AlertDialog(
              title: const Text('Not Found'),
              content: const Text('Voucher not found'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          ),
        );
      }
      return null;
    } catch (e) {
      await Future.delayed(const Duration(milliseconds: 300));
      Get.dialog(
        Builder(
          builder: (context) => AlertDialog(
            title: const Text('Error'),
            content: Text('Failed to validate voucher: $e'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        ),
      );
      return null;
    }
  }

  List<VoucherModel> getActiveVouchers() {
    return vouchers.where((v) => v.isActive).toList();
  }
}
