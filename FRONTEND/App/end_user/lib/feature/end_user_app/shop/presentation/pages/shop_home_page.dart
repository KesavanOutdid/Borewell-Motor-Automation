import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';
import '../../../../../core/services/token_service.dart';
import '../controllers/shop_controller.dart';
import '../controllers/cart_controller.dart';
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

  @override
  void initState() {
    super.initState();
    print('🏗️ ShopHomeView initState - Initializing controller');
    controller = Get.put(ShopController(), permanent: false);
    cartController = Get.put(CartController(), permanent: true);
    print('✅ Controller initialized - Products: ${controller.products.length}');
  }

  @override
  void dispose() {
    print('🗑️ ShopHomeView dispose');
    Get.delete<ShopController>();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokenService = Get.find<TokenService>();
    final userName = tokenService.getUserName() ?? 'User';
    
    print('🏪 ShopHomeView build - Products count: ${controller.products.length}');
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
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
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            sliver: SliverToBoxAdapter(
              child: _buildSearchBar(),
            ),
          ),
          Obx(() {
            print('📊 Obx rebuild - isLoading: ${controller.isLoading.value}, products: ${controller.products.length}, filtered: ${controller.filteredProducts.length}');
            
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

            final filteredProducts = controller.filteredProducts;
            
            if (filteredProducts.isEmpty) {
              return const SliverFillRemaining(
                child: Center(
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
                ),
              );
            }

            print('✅ Showing ${filteredProducts.length} filtered products');
            return SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final rowIndex = index * 2;
                    
                    if (rowIndex >= filteredProducts.length) {
                      if (controller.hasNextPage.value && controller.searchQuery.value.isEmpty) {
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
                    
                    final leftProduct = filteredProducts[rowIndex];
                    final rightProduct = (rowIndex + 1 < filteredProducts.length) 
                        ? filteredProducts[rowIndex + 1] 
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
                  childCount: (filteredProducts.length / 2).ceil() + 
                      (controller.hasNextPage.value && controller.searchQuery.value.isEmpty ? 1 : 0),
                ),
              ),
            );
          }),
          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
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
    );
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
      onTap: () {
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
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
              height: 1.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            productDescription,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey.shade600,
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
}
