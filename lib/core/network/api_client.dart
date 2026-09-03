import 'package:dio/dio.dart';

class ApiClient {
  late final Dio dio;

  ApiClient({String? baseUrl, String? authToken}) {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? 'https://api.yapper.local/v1',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add custom tracing/logging if needed
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          // Centralized error handling
          return handler.next(e);
        },
      ),
    );
  }
}
