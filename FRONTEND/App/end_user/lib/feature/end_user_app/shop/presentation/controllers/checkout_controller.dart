import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:agri_plus/utils/ui_utils.dart';
import '../../../dashboard/presentation/controllers/dashboard_controller.dart';
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
      UIUtils.showErrorDialog(message: 'User not logged in');
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
            UIUtils.showErrorSnackbar(
              title: 'Error',
              message: 'Failed to initialize payment: Invalid response from server',
            );
          }
        } else {
          logger.w('⚠️ API returned success=false');
          UIUtils.showErrorSnackbar(
            title: 'Error',
            message: responseData['message'] ?? 'Order creation failed',
          );
        }
      } else {
        logger.e('❌ HTTP Error: ${response.statusCode}');
        try {
          final Map<String, dynamic> responseData = jsonDecode(response.body);
          UIUtils.showErrorSnackbar(
            title: 'Error',
            message: responseData['message'] ?? 'Failed to create order (${response.statusCode})',
          );
        } catch (e) {
          UIUtils.showErrorSnackbar(
            title: 'Error',
            message: 'Failed to create order: HTTP ${response.statusCode}',
          );
        }
      }
    } catch (e, stackTrace) {
      logger.e('❌ Exception: $e');
      logger.e('Stack trace: $stackTrace');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to create order: ${e.toString()}',
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
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to open payment gateway',
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
    UIUtils.showErrorSnackbar(
      title: 'Payment Failed',
      message: response.message ?? 'Payment was not successful',
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    logger.i('🔗 External Wallet: ${response.walletName}');
    UIUtils.showSuccessSnackbar(
      title: 'External Wallet',
      message: 'Payment via ${response.walletName}',
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
      UIUtils.showErrorDialog(message: 'User not logged in');
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
          UIUtils.showErrorSnackbar(
            title: 'Verification Failed',
            message: responseData['message'] ?? 'Payment verification failed',
          );
        }
      } else {
        UIUtils.showErrorSnackbar(
          title: 'Error',
          message: 'Payment verification failed',
        );
      }
    } catch (e) {
      logger.e('❌ Exception: $e');
      UIUtils.showErrorSnackbar(
        title: 'Error',
        message: 'Failed to verify payment',
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
                          Navigator.of(context, rootNavigator: true).pop();
                          Get.offAllNamed('/home', arguments: {'index': 2});
                          try {
                            if (Get.isRegistered<DashboardController>()) {
                              Get.find<DashboardController>().changePage(2);
                            }
                          } catch (e) {
                            logger.e('Error setting dashboard index: $e');
                          }
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
                          Navigator.of(context, rootNavigator: true).pop();
                          Get.offAllNamed('/home', arguments: {'index': 1});
                          try {
                            if (Get.isRegistered<DashboardController>()) {
                              Get.find<DashboardController>().changePage(1);
                            }
                          } catch (e) {
                            logger.e('Error setting dashboard index: $e');
                          }
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
