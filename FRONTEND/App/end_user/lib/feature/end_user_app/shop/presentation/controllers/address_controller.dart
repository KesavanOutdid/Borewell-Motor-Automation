import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:agri_plus/utils/ui_utils.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../core/config/env.dart';
import '../../data/models/address_model.dart';

class AddressController extends GetxController {
  var addresses = <AddressModel>[].obs;
  var isLoading = false.obs;
  var selectedAddress = Rxn<AddressModel>();
  
  final String baseUrl = AppConfig.baseUrl;
  
  late TokenService tokenService;
  final logger = Logger();

  @override
  void onInit() {
    super.onInit();
    logger.i('AddressController initialized');
    tokenService = Get.find<TokenService>();
  }

  Future<void> fetchAddresses() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      logger.w('⚠️ User not logged in');
      return;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/address/getAddresses');
    logger.i('📍 Fetching addresses for user: $userId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'user_id': userId}),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          final List<dynamic> addressesData = responseData['data']['addresses'] ?? [];
          addresses.value = addressesData
              .map((addressJson) => AddressModel.fromJson(addressJson))
              .toList();
          logger.i('✅ Addresses fetched - Count: ${addresses.length}');
          
          final defaultAddress = addresses.firstWhereOrNull((addr) => addr.isDefault);
          if (defaultAddress != null) {
            selectedAddress.value = defaultAddress;
          }
        }
      } else {
        logger.e('❌ HTTP Error: ${response.statusCode}');
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to fetch addresses',
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> createAddress(AddressModel address) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'User not logged in',
      );
      return false;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/address/createAddress');
    logger.i('📍 Creating address');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(address.toJson()),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Address created successfully');
          await fetchAddresses();
          return true;
        }
      }
      
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to create address',
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to create address',
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateAddress(AddressModel address) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'User not logged in',
      );
      return false;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/address/updateAddress');
    logger.i('📍 Updating address: ${address.id}');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(address.toJson()),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Address updated successfully');
          await fetchAddresses();
          return true;
        }
      }
      
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to update address',
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to update address',
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> deleteAddress(int addressId) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'User not logged in',
      );
      return false;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/address/deleteAddress');
    logger.i('📍 Deleting address: $addressId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'address_id': addressId,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Address deleted successfully');
          UIUtils.showSuccessSnackbar(
            title: 'Success',
            message: 'Address deleted successfully',
          );
          
          await fetchAddresses();
          return true;
        }
      }
      
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to delete address',
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to delete address',
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> setDefaultAddress(int addressId) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'User not logged in',
      );
      return false;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/address/setDefaultAddress');
    logger.i('📍 Setting default address: $addressId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'address_id': addressId,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Default address set successfully');
          await fetchAddresses();
          return true;
        }
      }
      
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to set default address',
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to set default address',
      );
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  AddressModel? get defaultAddress {
    return addresses.firstWhereOrNull((addr) => addr.isDefault);
  }
}
