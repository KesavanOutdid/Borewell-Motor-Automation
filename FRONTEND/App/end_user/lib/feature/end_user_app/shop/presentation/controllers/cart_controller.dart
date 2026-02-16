import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:agri_plus/utils/ui_utils.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../core/config/env.dart';
import '../../data/models/cart_model.dart';

class CartController extends GetxController {
  var cart = Rxn<CartModel>();
  var isLoading = false.obs;
  var errorMessage = ''.obs;
  var updatingProductIds = <int>{}.obs;
  
  final String baseUrl = AppConfig.baseUrl;
  
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

  Future<bool> addToCart(int productId, int quantity, {CartItem? productData}) async {
    // Check total quantity including existing cart items
    final existingItem = cart.value?.items.firstWhereOrNull((item) => item.productId == productId);
    final existingQuantity = existingItem?.quantity ?? 0;
    
    if (existingQuantity + quantity > 3) {
      UIUtils.showErrorDialog(
        title: 'Limit Exceeded',
        message: 'You already have $existingQuantity in cart. Total limit is 3 units per product.',
      );
      return false;
    }

    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      UIUtils.showErrorDialog(message: 'User not logged in');
      return false;
    }

    // Optimistic Update if we have product data or it's already in cart
    final previousCart = cart.value;
    if (cart.value != null && (existingItem != null || productData != null)) {
      List<CartItem> updatedItems = List.from(cart.value!.items);
      if (existingItem != null) {
        final index = updatedItems.indexWhere((item) => item.productId == productId);
        final newItem = CartItem(
          productId: existingItem.productId,
          productName: existingItem.productName,
          productImage: existingItem.productImage,
          price: existingItem.price,
          quantity: existingItem.quantity + quantity,
          subtotal: existingItem.price * (existingItem.quantity + quantity),
          gst: existingItem.gst,
          shippingCost: existingItem.shippingCost,
        );
        updatedItems[index] = newItem;
      } else if (productData != null) {
        updatedItems.add(productData.copyWith(quantity: quantity, subtotal: productData.price * quantity));
      }

      double newTotalPrice = updatedItems.fold(0, (sum, item) => sum + item.subtotal);
      cart.value = CartModel(
        userId: userId,
        items: updatedItems,
        totalPrice: newTotalPrice,
        totalGst: cart.value!.totalGst,
        totalShippingCost: cart.value!.totalShippingCost,
        grandTotal: newTotalPrice + cart.value!.totalGst + cart.value!.totalShippingCost,
      );
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

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          cart.value = CartModel.fromJson(responseData['cart']);
          return true;
        }
      } else {
        cart.value = previousCart;
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        UIUtils.showErrorDialog(message: responseData['message'] ?? 'Failed to add to cart');
      }
    } catch (e) {
      cart.value = previousCart;
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(title: 'Error', message: 'Failed to add product to cart');
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
    errorMessage.value = '';
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
      } else {
        errorMessage.value = 'Failed to fetch cart (${response.statusCode})';
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      errorMessage.value = 'Network connection failed. Please check your internet.';
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> updateCartItem(int productId, int quantity) async {
    if (quantity > 3) {
      UIUtils.showErrorDialog(
        title: 'Limit Exceeded',
        message: 'You can only order a maximum of 3 units of this product.',
      );
      return false;
    }
    
    if (updatingProductIds.contains(productId)) return false;
    
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      UIUtils.showErrorDialog(message: 'User not logged in');
      return false;
    }

    // Optimistic Update: Update UI immediately
    final previousCart = cart.value;
    if (cart.value != null) {
      final updatedItems = cart.value!.items.map((item) {
        if (item.productId == productId) {
          final newSubtotal = item.price * quantity;
          return CartItem(
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            price: item.price,
            quantity: quantity,
            subtotal: newSubtotal,
            gst: item.gst, // Approximation for UI
            shippingCost: item.shippingCost,
          );
        }
        return item;
      }).toList();

      double newTotalPrice = 0;
      for (var item in updatedItems) {
        newTotalPrice += item.subtotal;
      }

      cart.value = CartModel(
        userId: userId,
        items: updatedItems,
        totalPrice: newTotalPrice,
        totalGst: cart.value!.totalGst,
        totalShippingCost: cart.value!.totalShippingCost,
        grandTotal: newTotalPrice + cart.value!.totalGst + cart.value!.totalShippingCost,
      );
    }

    updatingProductIds.add(productId);
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

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          cart.value = CartModel.fromJson(responseData['cart']);
          return true;
        }
      } else {
        // Rollback on error
        cart.value = previousCart;
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        UIUtils.showErrorDialog(
          message: responseData['message'] ?? 'Failed to update cart',
        );
      }
    } catch (e) {
      cart.value = previousCart;
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to update cart',
      );
    } finally {
      updatingProductIds.remove(productId);
    }
    
    return false;
  }

  Future<bool> removeFromCart(int productId) async {
    if (updatingProductIds.contains(productId)) return false;

    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      UIUtils.showErrorDialog(message: 'User not logged in');
      return false;
    }

    // Optimistic Update
    final previousCart = cart.value;
    if (cart.value != null) {
      final updatedItems = cart.value!.items.where((item) => item.productId != productId).toList();
      double newTotalPrice = 0;
      for (var item in updatedItems) {
        newTotalPrice += item.subtotal;
      }
      
      cart.value = CartModel(
        userId: userId,
        items: updatedItems,
        totalPrice: newTotalPrice,
        totalGst: cart.value!.totalGst,
        totalShippingCost: cart.value!.totalShippingCost,
        grandTotal: newTotalPrice + cart.value!.totalGst + cart.value!.totalShippingCost,
      );
    }

    updatingProductIds.add(productId);
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

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        if (responseData['success'] == true) {
          cart.value = CartModel.fromJson(responseData['cart']);
          return true;
        }
      } else {
        cart.value = previousCart;
      }
    } catch (e) {
      cart.value = previousCart;
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to remove product from cart',
      );
    } finally {
      updatingProductIds.remove(productId);
    }
    
    return false;
  }

  Future<bool> clearCart() async {
    if (isLoading.value) return false;

    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    if (userId == null || token == null) {
      UIUtils.showErrorDialog(message: 'User not logged in');
      return false;
    }

    // Optimistic Update
    final previousCart = cart.value;
    cart.value = null;

    isLoading.value = true;
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

      if (response.statusCode == 200) {
        return true;
      } else {
        cart.value = previousCart;
        return false;
      }
    } catch (e) {
      cart.value = previousCart;
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to clear cart',
      );
    } finally {
      isLoading.value = false;
    }
    
    return false;
  }

  String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return '$baseUrl$imagePath';
  }
}
