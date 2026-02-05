import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import '../../../../../core/services/token_service.dart';
import '../../data/models/cart_model.dart';

class CartController extends GetxController {
  var cart = Rxn<CartModel>();
  var isLoading = false.obs;
  
  final String baseUrl = 'http://10.149.200.218:3030';
  
  late TokenService tokenService;
  final logger = Logger();

  int get cartItemCount => cart.value?.items.length ?? 0;
  
  @override
  void onInit() {
    super.onInit();
    logger.i('CartController initialized');
    tokenService = Get.find<TokenService>();
    fetchCart();
  }

  Future<bool> addToCart(int productId, int quantity) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      Get.defaultDialog(
        title: 'Error',
        middleText: 'User not logged in',
        textConfirm: 'OK',
        confirmTextColor: Colors.white,
        onConfirm: () => Get.back(),
      );
      return false;
    }

    final url = Uri.parse('$baseUrl/app/addCart');
    logger.i('🛒 Adding to cart - Product: $productId, Quantity: $quantity');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'product_id': productId,
          'quantity': quantity,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Product added to cart successfully');
          await fetchCart();
          return true;
        }
      } else if (response.statusCode == 400) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        final message = responseData['message'] ?? 'Validation error';
        Get.snackbar(
          message.contains('Insufficient product quantity') ? 'Out of Stock' : 'Error',
          message.contains('Insufficient product quantity') 
              ? 'This product is currently out of stock or has insufficient quantity available.'
              : message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
          duration: const Duration(seconds: 3),
        );
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to add product to cart',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
    
    return false;
  }

  Future<void> fetchCart() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      logger.w('⚠️ User not logged in');
      return;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/fetchCart');
    logger.i('📦 Fetching cart for user: $userId');

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
          cart.value = CartModel.fromJson(responseData['cart']);
          logger.i('✅ Cart fetched - Items: ${cart.value?.items.length}');
        }
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateCartItem(int productId, int quantity) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      Get.defaultDialog(
        title: 'Error',
        middleText: 'User not logged in',
        textConfirm: 'OK',
        confirmTextColor: Colors.white,
        onConfirm: () => Get.back(),
      );
      return false;
    }

    final url = Uri.parse('$baseUrl/app/updatedCart');
    logger.i('🔄 Updating cart - Product: $productId, Quantity: $quantity');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'product_id': productId,
          'quantity': quantity,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Cart updated successfully');
          await fetchCart();
          return true;
        }
      } else if (response.statusCode == 400) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        Get.snackbar(
          'Error',
          responseData['message'] ?? 'Insufficient product quantity',
          snackPosition: SnackPosition.BOTTOM,
        );
      } else if (response.statusCode == 404) {
        logger.i('⚠️ Product or cart not found - refreshing cart');
        await fetchCart();
        return true;
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to update cart',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
    
    return false;
  }

  Future<bool> removeFromCart(int productId) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      Get.defaultDialog(
        title: 'Error',
        middleText: 'User not logged in',
        textConfirm: 'OK',
        confirmTextColor: Colors.white,
        onConfirm: () => Get.back(),
      );
      return false;
    }

    final url = Uri.parse('$baseUrl/app/productDelete');
    logger.i('🗑️ Removing product from cart - Product: $productId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'product_id': productId,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Product removed from cart');
          await fetchCart();
          return true;
        }
      } else if (response.statusCode == 404) {
        logger.i('⚠️ Product or cart not found - refreshing cart');
        await fetchCart();
        return true;
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to remove product from cart',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
    
    return false;
  }

  Future<bool> clearCart() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      Get.defaultDialog(
        title: 'Error',
        middleText: 'User not logged in',
        textConfirm: 'OK',
        confirmTextColor: Colors.white,
        onConfirm: () => Get.back(),
      );
      return false;
    }

    final url = Uri.parse('$baseUrl/app/allProductDelete');
    logger.i('🗑️ Clearing entire cart');

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
          logger.i('✅ Cart cleared successfully');
          cart.value = null;
          await fetchCart();
          return true;
        }
      } else if (response.statusCode == 404) {
        logger.i('⚠️ Cart not found on backend - clearing local cart');
        cart.value = null;
        return true;
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to clear cart',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
    
    return false;
  }

  String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return '$baseUrl$imagePath';
  }
}
