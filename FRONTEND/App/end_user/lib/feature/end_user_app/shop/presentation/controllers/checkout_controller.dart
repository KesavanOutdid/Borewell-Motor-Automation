import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../core/config/env.dart';
import '../../data/models/order_model.dart';
import '../../data/models/cart_model.dart';
import '../controllers/cart_controller.dart';
import '../../../../../utils/theme/app_colors.dart';

class CheckoutController extends GetxController {
  var isProcessing = false.obs;
  
  final String baseUrl = AppConfig.baseUrl;
  final String razorpayKeyId = 'rzp_test_oHoZ3Q1fF6pYEI';
  
  late TokenService tokenService;
  final logger = Logger();
  late Razorpay _razorpay;
  String? _currentOrderId;

  @override
  void onInit() {
    super.onInit();
    logger.i('CheckoutController initialized');
    tokenService = Get.find<TokenService>();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void onClose() {
    _razorpay.clear();
    super.onClose();
  }

  Future<void> createOrder({
    required CartModel cart,
    required ShippingAddress shippingAddress,
    required String paymentMethod,
  }) async {
    final userId = tokenService.getUserId();
    final userEmail = tokenService.getUserEmail();
    
    if (userId == null || userEmail == null) {
      Get.defaultDialog(
        title: 'Error',
        middleText: 'User not logged in',
        textConfirm: 'OK',
        confirmTextColor: Colors.white,
        onConfirm: () => Get.back(),
      );
      return;
    }

    isProcessing.value = true;
    final url = Uri.parse('$baseUrl/app/order/createOrder');
    logger.i('🛒 Creating order - Payment Method: $paymentMethod');
    logger.i('📍 User ID: $userId, Email: $userEmail');

    try {
      final orderItems = cart.items.map((item) {
        final gstPercent = item.subtotal > 0 
            ? (item.gst / item.subtotal) * 100 
            : 0.0;
        logger.i('📦 Item: ${item.productName}, GST%: $gstPercent, Price: ${item.price}, Qty: ${item.quantity}');
        
        return {
          'product_id': item.productId,
          'product_name': item.productName,
          'product_price': item.price,
          'product_gst': gstPercent,
          'product_shipping_cost': item.shippingCost,
          'quantity': item.quantity,
          'product_main_image': item.productImage,
        };
      }).toList();

      final requestBody = {
        'user_id': userId,
        'cart_items': orderItems,
        'shipping_address': shippingAddress.toJson(),
        'order_summary': {
          'total_price': cart.totalPrice,
          'total_gst': cart.totalGst,
          'total_shipping_cost': cart.totalShippingCost,
          'grand_total': cart.grandTotal,
        },
        'payment_method': paymentMethod,
      };

      logger.i('📄 Request Body: ${jsonEncode(requestBody)}');
      logger.i('🌐 API URL: $url');

      final token = tokenService.getToken();
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${token ?? ''}',
        },
        body: jsonEncode(requestBody),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.i('📄 Response Body: ${response.body}');

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        logger.i('✅ Response parsed: ${responseData['success']}');
        
        if (responseData['success'] == true) {
          logger.i('✅ Order created successfully');
          
          _currentOrderId = responseData['data']['order_id'];
          logger.i('💳 Order ID stored: $_currentOrderId');
          
          logger.i('💳 Opening Razorpay payment gateway');
          try {
            final razorpayOrderData = responseData['data']['razorpay_order'];
            final keyId = responseData['data']['key_id'];
            
            logger.i('💳 Razorpay Order ID: ${razorpayOrderData['id']}');
            logger.i('💳 Amount: ${razorpayOrderData['amount']}');
            logger.i('💳 Key ID: $keyId');
            
            _openRazorpayCheckout(
              orderId: razorpayOrderData['id'],
              amount: razorpayOrderData['amount'],
              currency: razorpayOrderData['currency'],
              keyId: keyId,
              userEmail: userEmail,
              userName: tokenService.getUserName() ?? 'User',
              phone: shippingAddress.phone,
            );
          } catch (e) {
            logger.e('❌ Razorpay data parsing error: $e');
            Get.snackbar(
              'Error',
              'Failed to initialize payment: Invalid response from server',
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.red,
              colorText: Colors.white,
              duration: const Duration(seconds: 4),
            );
          }
        } else {
          logger.w('⚠️ API returned success=false');
          Get.snackbar(
            'Error',
            responseData['message'] ?? 'Order creation failed',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
      } else {
        logger.e('❌ HTTP Error: ${response.statusCode}');
        try {
          final Map<String, dynamic> responseData = jsonDecode(response.body);
          Get.snackbar(
            'Error',
            responseData['message'] ?? 'Failed to create order (${response.statusCode})',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
            duration: const Duration(seconds: 4),
          );
        } catch (e) {
          Get.snackbar(
            'Error',
            'Failed to create order: HTTP ${response.statusCode}',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
      }
    } catch (e, stackTrace) {
      logger.e('❌ Exception: $e');
      logger.e('Stack trace: $stackTrace');
      Get.snackbar(
        'Error',
        'Failed to create order: ${e.toString()}',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
    } finally {
      isProcessing.value = false;
      logger.i('🏁 Order creation process completed');
    }
  }

  void _openRazorpayCheckout({
    required String orderId,
    required int amount,
    required String currency,
    required String keyId,
    required String userEmail,
    required String userName,
    required String phone,
  }) {
    final options = {
      'key': keyId,
      'amount': amount,
      'currency': currency,
      'order_id': orderId,
      'name': 'AgriPlus',
      'description': 'Order Payment',
      'prefill': {
        'contact': phone,
        'email': userEmail,
        'name': userName,
      },
      'theme': {
        'color': '#4CAF50',
      },
    };

    logger.i('🔓 Opening Razorpay checkout with options: $options');

    try {
      _razorpay.open(options);
    } catch (e) {
      logger.e('❌ Razorpay Error: $e');
      Get.snackbar(
        'Error',
        'Failed to open payment gateway',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    logger.i('✅ Payment Success: ${response.paymentId}');
    logger.i('Order ID: ${response.orderId}');
    logger.i('Signature: ${response.signature}');
    
    verifyPayment(
      razorpayOrderId: response.orderId ?? '',
      razorpayPaymentId: response.paymentId ?? '',
      razorpaySignature: response.signature ?? '',
    );
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    logger.e('❌ Payment Error: ${response.code} - ${response.message}');
    Get.snackbar(
      'Payment Failed',
      response.message ?? 'Payment was not successful',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red,
      colorText: Colors.white,
      duration: const Duration(seconds: 4),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    logger.i('🔗 External Wallet: ${response.walletName}');
    Get.snackbar(
      'External Wallet',
      'Payment via ${response.walletName}',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  Future<void> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
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
      return;
    }

    isProcessing.value = true;
    final url = Uri.parse('$baseUrl/app/order/verifyPayment');
    logger.i('🔍 Verifying payment');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'order_id': _currentOrderId,
          'razorpay_order_id': razorpayOrderId,
          'razorpay_payment_id': razorpayPaymentId,
          'razorpay_signature': razorpaySignature,
        }),
      );

      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        
        if (responseData['success'] == true) {
          logger.i('✅ Payment verified successfully');
          
          try {
            final cartController = Get.find<CartController>();
            await cartController.clearCart();
            logger.i('🗑️ Cart cleared successfully');
          } catch (e) {
            logger.e('❌ Error clearing cart: $e');
          }
          
          Get.back();
          
          _showOrderSuccessDialog();
        } else {
          Get.snackbar(
            'Verification Failed',
            responseData['message'] ?? 'Payment verification failed',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
      } else {
        Get.snackbar(
          'Error',
          'Payment verification failed',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      Get.snackbar(
        'Error',
        'Failed to verify payment',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      isProcessing.value = false;
    }
  }

  void _showOrderSuccessDialog() {
    Get.dialog(
      WillPopScope(
        onWillPop: () async => false,
        child: Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Builder(
            builder: (context) {
              final isDark = Theme.of(context).brightness == Brightness.dark;
              return Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_circle,
                        color: AppColors.primaryGreen,
                        size: 64,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Order Placed Successfully!',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.titleLarge?.color ?? AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Your order has been confirmed and will be processed soon.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).textTheme.bodyMedium?.color ?? AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Get.back();
                          Get.offNamedUntil('/orders', (route) => route.settings.name == '/home');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'View Orders',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          Get.back();
                          Get.offNamedUntil('/home', (route) => false);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primaryGreen,
                          side: const BorderSide(color: AppColors.primaryGreen),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Continue Shopping',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }
          ),
        ),
      ),
      barrierDismissible: false,
    );
  }
}
