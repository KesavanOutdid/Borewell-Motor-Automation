import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import '../../../../../core/services/token_service.dart';
import '../../data/models/address_model.dart';

class AddressController extends GetxController {
  var addresses = <AddressModel>[].obs;
  var isLoading = false.obs;
  var selectedAddress = Rxn<AddressModel>();
  
  final String baseUrl = 'http://10.149.200.218:3030';
  
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
      Get.snackbar(
        'Error',
        'Failed to fetch addresses',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> createAddress(AddressModel address) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
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
      
      Get.snackbar(
        'Error',
        'Failed to create address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to create address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
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
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
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
      
      Get.snackbar(
        'Error',
        'Failed to update address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to update address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
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
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
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
          Get.snackbar(
            'Success',
            'Address deleted successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white,
          );
          
          await fetchAddresses();
          return true;
        }
      }
      
      Get.snackbar(
        'Error',
        'Failed to delete address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to delete address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
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
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
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
      
      Get.snackbar(
        'Error',
        'Failed to set default address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return false;
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to set default address',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
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
