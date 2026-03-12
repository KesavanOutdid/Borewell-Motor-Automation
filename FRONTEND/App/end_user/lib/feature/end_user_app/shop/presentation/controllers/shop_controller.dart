import 'package:flutter/material.dart';
import 'dart:io';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';
import 'package:logger/logger.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../utils/ui_utils.dart';
import '../../../../../core/config/env.dart';

class ShopController extends GetxController {
  var products = <Map<String, dynamic>>[].obs;
  var isLoading = false.obs;
  var isLoadingMore = false.obs;
  var errorMessage = "".obs;
  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var hasNextPage = false.obs;
  var searchQuery = ''.obs;
  
  final String baseUrl = AppConfig.baseUrl;
  final int limit = 10;
  
  late TokenService tokenService;
  final logger = Logger();
  final _storage = GetStorage();
  bool _shouldShuffleOnNextDisplay = false;

  List<Map<String, dynamic>> get filteredProducts {
    if (searchQuery.value.isEmpty) {
      return products;
    }
    
    final query = searchQuery.value.toLowerCase();
    return products.where((product) {
      final name = (product['product_name'] ?? '').toString().toLowerCase();
      final description = (product['product_description'] ?? '').toString().toLowerCase();
      final price = (product['product_price'] ?? '').toString().toLowerCase();
      
      return name.contains(query) || 
             description.contains(query) || 
             price.contains(query);
    }).toList();
  }

  void updateSearchQuery(String query) {
    searchQuery.value = query;
  }

  void clearSearch() {
    searchQuery.value = '';
  }

  void setShouldShuffleOnNextDisplay() {
    _shouldShuffleOnNextDisplay = true;
    logger.i('🔀 Shuffle scheduled for next display');
  }

  void shuffleProductsIfNeeded() {
    if (_shouldShuffleOnNextDisplay && products.isNotEmpty) {
      final List<Map<String, dynamic>> shuffled = List<Map<String, dynamic>>.from(products);
      shuffled.shuffle(Random());
      products.assignAll(shuffled);
      logger.i('🔀 Products shuffled');
      _shouldShuffleOnNextDisplay = false;
    }
  }

  @override
  void onInit() {
    super.onInit();
    logger.i('ShopController initialized');
    tokenService = Get.find<TokenService>();
    _loadCachedProducts();
    fetchProducts();
  }

  void _loadCachedProducts() {
    try {
      final cached = _storage.read('shop_products');
      if (cached != null) {
        final List<Map<String, dynamic>> list = List<Map<String, dynamic>>.from(
          (cached as List).map((i) => Map<String, dynamic>.from(i))
        );
        if (list.isNotEmpty) {
          logger.i('📦 [SHOP] Loaded ${list.length} products from cache');
          products.assignAll(list);
        }
      }
    } catch (e) {
      logger.e('📦 [SHOP] Error loading cached products: $e');
    }
  }

  Future<void> fetchProducts({bool isRefresh = false}) async {
    logger.i('📦 fetchProducts called - isRefresh: $isRefresh, currentPage: ${currentPage.value}');
    
    if (isRefresh) {
      currentPage.value = 1;
      products.clear();
      logger.i('🔄 Refreshing - reset to page 1');
    }
    
    if (currentPage.value == 1) {
      isLoading.value = true;
      errorMessage.value = "";
      if (!isRefresh) {
        products.clear();
        logger.i('🔄 Clearing products for fresh page 1 load');
      }
    } else {
      isLoadingMore.value = true;
    }

    final url = Uri.parse('$baseUrl/app/getProducts?page=${currentPage.value}&limit=$limit');
    logger.i('🌐 API URL: $url');

    try {
      logger.i('⏳ Sending HTTP GET request...');
      final response = await http.get(url);
      
      logger.i('📡 Response Status Code: ${response.statusCode}');
      logger.d('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        logger.i('✅ Response parsed successfully');
        logger.d('📊 Response Data: $responseData');
        
        if (responseData['success'] == true) {
          final List<dynamic> newProducts = responseData['data'] ?? [];
          final pagination = responseData['pagination'];
          
          logger.i('🎯 Success! Products count: ${newProducts.length}');
          logger.d('📦 Products: $newProducts');
          logger.d('📄 Pagination: $pagination');
          
          final fetchedBatch = List<Map<String, dynamic>>.from(newProducts.cast<Map<String, dynamic>>());
          
          if (isRefresh) {
            fetchedBatch.shuffle(Random());
            products.value = fetchedBatch;
          } else {
            products.addAll(fetchedBatch);
          }

          if (currentPage.value == 1) {
            await _storage.write('shop_products', products);
          }
          
          totalPages.value = pagination['totalPages'] ?? 1;
          hasNextPage.value = pagination['hasNextPage'] ?? false;
          
          logger.i('✅ Products loaded - Total: ${products.length}, HasNext: ${hasNextPage.value}');
        } else {
          logger.w('⚠️ API returned success=false');
        }
      } else {
        logger.e('❌ HTTP Error: ${response.statusCode}');
        logger.e('Response: ${response.body}');
      }
    } catch (e, stackTrace) {
      logger.e('❌ Exception caught: $e');
      logger.e('Stack trace: $stackTrace');
      
      String errorMsg = "Failed to load products. Please try again.";
      if (e is SocketException) {
        errorMsg = "Network connection failed. Please check your internet.";
      }

      errorMessage.value = errorMsg;
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
      logger.i('🏁 fetchProducts completed');
    }
  }

  Future<void> loadMore() async {
    logger.i('📄 loadMore called - isLoadingMore: ${isLoadingMore.value}, hasNextPage: ${hasNextPage.value}');
    if (!isLoadingMore.value && hasNextPage.value) {
      currentPage.value++;
      logger.i('➡️ Loading page ${currentPage.value}');
      await fetchProducts();
    }
  }

  Future<void> refresh() async {
    logger.i('🔄 Refresh called');
    await fetchProducts(isRefresh: true);
  }

  String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return '$baseUrl$imagePath';
  }
}
