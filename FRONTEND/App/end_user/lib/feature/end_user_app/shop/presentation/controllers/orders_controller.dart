import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import '../../../../../core/services/token_service.dart';
import '../../data/models/order_model.dart';

class OrdersController extends GetxController {
  var orders = <OrderModel>[].obs;
  var isLoading = false.obs;
  var selectedOrder = Rxn<OrderModel>();
  
  final String baseUrl = 'http://192.168.0.33:3030';
  
  late TokenService tokenService;
  final logger = Logger();

  @override
  void onInit() {
    super.onInit();
    logger.i('OrdersController initialized');
    tokenService = Get.find<TokenService>();
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      logger.w('⚠️ User not logged in');
      return;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/order/getOrders');
    logger.i('📦 Fetching orders for user: $userId');

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
          final List<dynamic> ordersData = responseData['data']['orders'] ?? [];
          orders.value = ordersData
              .map((orderJson) => OrderModel.fromJson(orderJson))
              .toList();
          logger.i('✅ Orders fetched - Count: ${orders.length}');
        }
      } else {
        logger.e('❌ HTTP Error: ${response.statusCode}');
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to fetch orders',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchOrderById(String orderId) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/order/getOrderById');
    logger.i('📦 Fetching order: $orderId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'order_id': orderId,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          selectedOrder.value = OrderModel.fromJson(responseData['data']['order']);
          logger.i('✅ Order fetched successfully');
        }
      } else {
        Get.snackbar(
          'Error',
          'Failed to fetch order details',
          snackPosition: SnackPosition.BOTTOM,
        );
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to fetch order details',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> cancelOrder(String orderId, String reason) async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    if (userId == null || token == null) {
      Get.snackbar(
        'Error',
        'User not logged in',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    isLoading.value = true;
    final url = Uri.parse('$baseUrl/app/order/cancelOrder');
    logger.i('🚫 Cancelling order: $orderId');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'order_id': orderId,
          'cancellation_reason': reason,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Order cancelled successfully');
          
          Get.snackbar(
            'Success',
            'Order cancelled successfully',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white,
          );
          
          await fetchOrders();
          if (selectedOrder.value?.orderId == orderId) {
            await fetchOrderById(orderId);
          }
        } else {
          Get.snackbar(
            'Error',
            responseData['message'] ?? 'Failed to cancel order',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
      } else {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        Get.snackbar(
          'Error',
          responseData['message'] ?? 'Failed to cancel order',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to cancel order',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
    }
  }

  String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return '$baseUrl$imagePath';
  }

  String getOrderStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Color getOrderStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'processing':
        return Colors.purple;
      case 'shipped':
        return Colors.teal;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String getPaymentStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  }

  Color getPaymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'failed':
        return Colors.red;
      case 'refunded':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
