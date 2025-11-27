import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:curl_logger_dio_interceptor/curl_logger_dio_interceptor.dart';

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
        }
        return handler.next(e);
      },
    ));

    // Optional: cURL logs (copy/paste to debug)
    _dio.interceptors.add(CurlLoggerDioInterceptor());
  }

  Dio get client => _dio;
}