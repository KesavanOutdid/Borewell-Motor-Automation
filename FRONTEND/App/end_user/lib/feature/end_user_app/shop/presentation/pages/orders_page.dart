import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../controllers/orders_controller.dart';
import '../../../../../utils/widgets/ui_components.dart';

class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});

  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  final controller = Get.put(OrdersController());
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      controller.fetchOrders();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(40),
                bottomRight: Radius.circular(40),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () => Scaffold.of(context).openDrawer(),
                        child: Container(
                          height: 48,
                          width: 48,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.menu_rounded,
                            color: Colors.white,
                            size: 26,
                          ),
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('orders'.tr,
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -0.8,
                              ),
                            ),
                            
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primaryGreen,
              onRefresh: () => controller.fetchOrders(refresh: true),
              child: Obx(() {
                if (controller.isLoading.value && controller.orders.isEmpty) {
                  return _buildSkeleton();
                }

                if (controller.errorMessage.value.isNotEmpty) {
                  return SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: NetworkErrorWidget(
                        message: controller.errorMessage.value,
                        onRetry: () => controller.fetchOrders(refresh: true),
                      ),
                    ),
                  );
                }

                if (controller.orders.isEmpty) {
                  return SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.shopping_bag_outlined,
                              size: 100,
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? Colors.grey.shade700
                                  : Colors.grey.shade400,
                            ),
                            SizedBox(height: 16),
                            Text(
                              'No orders yet',
                              style: TextStyle(
                                fontSize: 18,
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? Colors.grey.shade400
                                    : Colors.grey.shade600,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Start shopping to see your orders here',
                              style: TextStyle(
                                fontSize: 14,
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? Colors.grey.shade500
                                    : Colors.grey.shade500,
                              ),
                            ),
                            SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () {
                                Get.offAllNamed('/home', arguments: {'index': 1});
                              },
                              icon: const Icon(Icons.shopping_cart_outlined),
                              label: Text('continue_shopping'.tr),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryGreen,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.zero,
                  itemCount: controller.orders.length + (controller.isMoreLoading.value ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index < controller.orders.length) {
                      final order = controller.orders[index];
                      return _buildOrderCard(context, order, controller);
                    } else {
                      return Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppColors.primaryGreen,
                            strokeWidth: 2,
                          ),
                        ),
                      );
                    }
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, dynamic order, OrdersController controller) {
    final int additionalItemsCount = order.cartItems.length > 1 ? order.cartItems.length - 1 : 0;
    
    return GestureDetector(
      onTap: () {
        Get.toNamed('/order-details', arguments: order.orderId);
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(
            bottom: BorderSide(color: Colors.grey.shade200, width: 1),
          ),
        ),
        child: Row(
          children: [
            Stack(
              children: [
                if (order.cartItems.isNotEmpty && order.cartItems[0].productMainImage != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      controller.getImageUrl(order.cartItems[0].productMainImage),
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.image, color: Colors.grey),
                        );
                      },
                    ),
                  )
                else
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey),
                  ),
                if (additionalItemsCount > 0)
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '+$additionalItemsCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.cartItems.isNotEmpty 
                        ? order.cartItems[0].productName 
                        : 'Order #${order.orderId.substring(0, 8).toUpperCase()}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    order.orderStatus.toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _getStatusColor(order.orderStatus),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'shipped':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildSkeleton() {
    return ListView.builder(
      padding: EdgeInsets.zero,
      itemCount: 6,
      itemBuilder: (context, index) => _buildSkeletonCard(),
    );
  }

  Widget _buildSkeletonCard() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: Color(0xFFEEEEEE), width: 1),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 180,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  SizedBox(height: 8),
                  Container(
                    width: 100,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
