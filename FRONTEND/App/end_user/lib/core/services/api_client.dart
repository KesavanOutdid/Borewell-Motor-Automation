import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:curl_logger_dio_interceptor/curl_logger_dio_interceptor.dart';
import 'package:get/get.dart' hide Response;
import '../../utils/ui_utils.dart';
import '../../feature/end_user_app/auth/presentation/controllers/auth_controller.dart';

class ApiClient {
  final Dio _dio = Dio();
  final Logger logger = Logger();

  ApiClient() {
    _dio.options.connectTimeout = Duration(seconds: 20);
    _dio.options.receiveTimeout = Duration(seconds: 20);

    // Full Log Interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        logger.i("⬆️ REQUEST");
        logger.i("URL: ${options.uri}");
        logger.i("Headers: ${options.headers}");
        logger.i("Body: ${options.data}");
        return handler.next(options);
      },
      onResponse: (response, handler) {
        logger.i("⬇️ RESPONSE");
        logger.i("Status: ${response.statusCode}");
        logger.i("Data: ${response.data}");
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        logger.e("❌ ERROR: ${e.message}");
        if (e.response != null) {
          logger.e("Status: ${e.response?.statusCode}");
          logger.e("Data: ${e.response?.data}");

          if (e.response?.statusCode == 403) {
            final message = e.response?.data['message'] ?? "Forbidden access";
            
            UIUtils.showErrorDialog(
              title: 'Account Alert',
              message: message,
            );

            if (message.toString().toLowerCase().contains("disabled") || 
                message.toString().toLowerCase().contains("deactivated")) {
              try {
                final authController = Get.find<AuthController>();
                authController.logout();
                Get.offAllNamed('/login');
              } catch (err) {
                logger.e("Error during logout: $err");
              }
            }
          }
        }
        return handler.next(e);
      },
    ));

    // Optional: cURL logs (copy/paste to debug)
    _dio.interceptors.add(CurlLoggerDioInterceptor());
  }

  Dio get client => _dio;
}