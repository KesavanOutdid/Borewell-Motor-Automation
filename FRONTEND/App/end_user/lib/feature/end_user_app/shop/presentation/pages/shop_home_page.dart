import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';
import '../../../../../core/services/token_service.dart';
import '../controllers/shop_controller.dart';
import '../controllers/cart_controller.dart';
import '../controllers/voucher_controller.dart';
import 'product_details_page.dart';
import 'cart_page.dart';

class ShopHomeView extends StatefulWidget {
  const ShopHomeView({super.key});

  @override
  State<ShopHomeView> createState() => _ShopHomeViewState();
}

class _ShopHomeViewState extends State<ShopHomeView> {
  late ShopController controller;
  late CartController cartController;
  late VoucherController voucherController;
  final ScrollController _voucherScrollController = ScrollController();
  Timer? _autoScrollTimer;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    print('🏗️ ShopHomeView initState - Initializing controller');
    controller = Get.put(ShopController(), permanent: false);
    cartController = Get.put(CartController(), permanent: true);
    voucherController = Get.put(VoucherController(), permanent: true);
    print('✅ Controller initialized - Products: ${controller.products.length}');
    _startAutoScroll();
  }

  @override
  void dispose() {
    print('🗑️ ShopHomeView dispose');
    _autoScrollTimer?.cancel();
    _voucherScrollController.dispose();
    Get.delete<ShopController>();
    super.dispose();
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_voucherScrollController.hasClients) {
        final maxScroll = _voucherScrollController.position.maxScrollExtent;
        final currentScroll = _voucherScrollController.offset;
        
        if (currentScroll >= maxScroll) {
          _voucherScrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeInOut,
          );
        } else {
          _voucherScrollController.animateTo(
            currentScroll + 290,
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final tokenService = Get.find<TokenService>();
    final userName = tokenService.getUserName() ?? 'User';
    
    print('🏪 ShopHomeView build - Products count: ${controller.products.length}');
    
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            leading: Container(
              margin: const EdgeInsets.only(left: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.search, color: Colors.white),
                onPressed: () {
                  _showSearchBottomSheet(context);
                },
              ),
            ),
            actions: [
              Obx(() {
                final itemCount = cartController.cartItemCount;
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.shopping_cart_outlined),
                        onPressed: () {
                          Get.to(() => const CartPage());
                        },
                      ),
                    ),
                    if (itemCount > 0)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            itemCount > 99 ? '99+' : '$itemCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              }),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: AppColors.primaryGradient,
                    ),
                  ),
                  Positioned(
                    right: -30,
                    top: -30,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 40,
                    top: 50,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  Positioned(
                    left: -20,
                    bottom: -20,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.07),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 20,
                    bottom: 24,
                    right: 80,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Welcome, $userName! ',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.power,
                              size: 14,
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Borewell Automation Store',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Obx(() {
              if (voucherController.vouchers.isEmpty) {
                return const SizedBox.shrink();
              }
              return _buildVoucherSection();
            }),
          ),
          Obx(() {
            print('📊 Obx rebuild - isLoading: ${controller.isLoading.value}, products: ${controller.products.length}');
            
            if (controller.isLoading.value && controller.products.isEmpty) {
              print('⏳ Showing loading indicator');
              return const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (controller.products.isEmpty) {
              print('❌ No products - showing empty state');
              return const SliverFillRemaining(
                child: Center(
                  child: Text('No products available'),
                ),
              );
            }

            final products = controller.products;

            print('✅ Showing ${products.length} products');
            return SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final rowIndex = index * 2;
                    
                    if (rowIndex >= products.length) {
                      if (controller.hasNextPage.value) {
                        controller.loadMore();
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    }
                    
                    final leftProduct = products[rowIndex];
                    final rightProduct = (rowIndex + 1 < products.length) 
                        ? products[rowIndex + 1] 
                        : null;
                    
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildProductCard(
                              leftProduct,
                              controller,
                              isLarge: false,
                            ),
                          ),
                          const SizedBox(width: 12),
                          if (rightProduct != null)
                            Expanded(
                              child: _buildProductCard(
                                rightProduct,
                                controller,
                                isLarge: false,
                              ),
                            )
                          else
                            const Expanded(child: SizedBox()),
                        ],
                      ),
                    );
                  },
                  childCount: (products.length / 2).ceil() + 
                      (controller.hasNextPage.value ? 1 : 0),
                ),
              ),
            );
          }),
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }

  void _showSearchBottomSheet(BuildContext context) {
    controller.clearSearch();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: AppColors.backgroundLight,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.backgroundLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                    ),
                    child: TextField(
                      autofocus: true,
                      onChanged: (value) => controller.updateSearchQuery(value),
                      decoration: InputDecoration(
                        hintText: 'Search motors, controllers...',
                        hintStyle: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade400,
                        ),
                        prefixIcon: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.search,
                            color: AppColors.primaryGreen,
                            size: 20,
                          ),
                        ),
                        suffixIcon: Obx(() => controller.searchQuery.value.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: () => controller.clearSearch(),
                              )
                            : const SizedBox.shrink()),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Obx(() {
                final filteredProducts = controller.filteredProducts;
                
                if (controller.searchQuery.value.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'Search for products',
                          style: TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }
                
                if (filteredProducts.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No products found',
                          style: TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }
                
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: (filteredProducts.length / 2).ceil(),
                  itemBuilder: (context, index) {
                    final rowIndex = index * 2;
                    final hasSecondProduct = rowIndex + 1 < filteredProducts.length;
                    
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildProductCard(
                              filteredProducts[rowIndex],
                              controller,
                            ),
                          ),
                          if (hasSecondProduct) ...[
                            const SizedBox(width: 16),
                            Expanded(
                              child: _buildProductCard(
                                filteredProducts[rowIndex + 1],
                                controller,
                              ),
                            ),
                          ] else
                            const Spacer(),
                        ],
                      ),
                    );
                  },
                );
              }),
            ),
          ],
        ),
      ),
    ).then((_) {
      controller.clearSearch();
    });
  }

  Widget _buildProductCard(Map<String, dynamic> product, ShopController controller, {bool isLarge = false}) {
    final imageUrl = controller.getImageUrl(product['product_main_image']);
    final productName = product['product_name'] ?? 'Unknown Product';
    final productPrice = product['product_price']?.toString() ?? '0';
    final productDescription = product['product_description'] ?? '';
    final productQuantity = product['product_quantity'] ?? 0;
    final isOutOfStock = productQuantity <= 0;

    final imageHeight = isLarge ? 180.0 : 140.0;
    
    return GradientCard(
      padding: const EdgeInsets.all(10),
      onTap: () async {
        await Future.wait([
          cartController.fetchCart(),
          controller.fetchProducts(isRefresh: true),
          voucherController.fetchVouchers(),
        ]);
        Get.to(
          () => const ProductDetailsView(),
          arguments: product,
          transition: Transition.rightToLeft,
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              Container(
                height: imageHeight,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          width: double.infinity,
                          height: imageHeight,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey.shade200,
                              child: const Center(
                                child: Icon(
                                  Icons.image_not_supported,
                                  size: 40,
                                  color: Colors.grey,
                                ),
                              ),
                            );
                          },
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Center(
                              child: CircularProgressIndicator(
                                value: loadingProgress.expectedTotalBytes != null
                                    ? loadingProgress.cumulativeBytesLoaded /
                                        loadingProgress.expectedTotalBytes!
                                    : null,
                                strokeWidth: 2,
                              ),
                            );
                          },
                        )
                      : Center(
                          child: Icon(
                            Icons.image,
                            size: 48,
                            color: Colors.grey.shade400,
                          ),
                        ),
                ),
              ),
              if (isOutOfStock)
                Container(
                  height: imageHeight,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      'OUT OF STOCK',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            productName,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            productDescription,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              height: 1.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  '₹$productPrice',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isOutOfStock ? Colors.grey : AppColors.primaryGreen,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isOutOfStock)
                Text(
                  'Out of Stock',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.red.shade600,
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.add_shopping_cart,
                    size: 14,
                    color: Colors.white,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVoucherSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Row(
            children: [
              Icon(Icons.local_offer, color: AppColors.primaryGreen, size: 20),
              SizedBox(width: 8),
              Text(
                'Available Offers',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 145,
          child: ListView.builder(
            controller: _voucherScrollController,
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: voucherController.vouchers.length,
            itemBuilder: (context, index) {
              final voucher = voucherController.vouchers[index];
              return _buildVoucherCard(voucher, index);
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildVoucherCard(voucher, int index) {
    final gradients = [
      [const Color(0xFFFF6B6B), const Color(0xFFFF8E53)],
      [const Color(0xFF4FACFE), const Color(0xFF00F2FE)],
      [const Color(0xFF43E97B), const Color(0xFF38F9D7)],
      [const Color(0xFFFA709A), const Color(0xFFFEE140)],
      [const Color(0xFF8E2DE2), const Color(0xFF4A00E0)],
      [const Color(0xFFFF512F), const Color(0xFFDD2476)],
      [const Color(0xFF11998E), const Color(0xFF38EF7D)],
      [const Color(0xFFFC466B), const Color(0xFF3F5EFB)],
      [const Color(0xFFF093FB), const Color(0xFFF5576C)],
      [const Color(0xFF4FACFE), const Color(0xFF00F2FE)],
    ];
    
    final gradient = gradients[(voucher.voucherCode.hashCode + index) % gradients.length];
    
    final widths = [270.0, 285.0, 280.0, 290.0, 275.0];
    final width = widths[index % widths.length];
    
    final heights = [135.0, 140.0, 138.0];
    final height = heights[index % heights.length];
    
    return Container(
      width: width,
      height: height,
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: gradient[0].withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.15),
              ),
            ),
          ),
          Positioned(
            left: -30,
            bottom: -30,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${voucher.discountPercentage}% OFF',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: gradient[0],
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (!voucher.isMaxedOut)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${voucher.maxUsage - voucher.usedCount} left',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Use Code',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 3),
                    InkWell(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: voucher.voucherCode));
                        Get.snackbar(
                          'Copied!',
                          'Voucher code ${voucher.voucherCode} copied to clipboard',
                          snackPosition: SnackPosition.BOTTOM,
                          backgroundColor: Colors.green,
                          colorText: Colors.white,
                          duration: const Duration(seconds: 2),
                          margin: const EdgeInsets.all(16),
                        );
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1.5,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              voucher.voucherCode,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: gradient[1],
                                letterSpacing: 0.8,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(Icons.copy, size: 13, color: gradient[0]),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
