import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';
import '../controllers/cart_controller.dart';
import '../controllers/voucher_controller.dart';

class CartPage extends StatefulWidget {
  const CartPage({super.key});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final voucherCodeController = TextEditingController();
  final voucherController = Get.find<VoucherController>();
  int? appliedDiscountPercentage;
  String? appliedVoucherCode;

  @override
  void dispose() {
    voucherCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(CartController());

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Shopping Cart'
            , style: TextStyle(color: Colors.white)),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
        ),
        actions: [
          Obx(() {
            final itemCount = controller.cartItemCount;
            if (itemCount > 0) {
              return TextButton.icon(
                onPressed: () => _showClearCartDialog(context, controller),
                icon: const Icon(Icons.delete_outline, color: Colors.white),
                label: const Text(
                  'Clear All',
                  style: TextStyle(color: Colors.white),
                ),
              );
            }
            return const SizedBox.shrink();
          }),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final cart = controller.cart.value;

        if (cart == null || cart.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.shopping_cart_outlined,
                  size: 100,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'Your cart is empty',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Add items to get started',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => Get.back(),
                  icon: const Icon(Icons.shopping_bag_outlined),
                  label: const Text('Continue Shopping'),
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
          );
        }

        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Items',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        Text(
                          '${cart.items.length} ${cart.items.length == 1 ? 'Item' : 'Items'}',
                          style: TextStyle(fontSize: 16, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...cart.items.map((item) => _buildCartItem(context, item, controller)).toList(),
                ],
              ),
            ),
            _buildCartSummary(cart, controller),
          ],
        );
      }),
    );
  }

  Widget _buildCartItem(BuildContext context, dynamic item, CartController controller) {
    final imageUrl = controller.getImageUrl(item.productImage);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.shade100),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Icon(Icons.image_not_supported, color: Colors.grey.shade400, size: 30),
                      )
                    : Icon(Icons.image, color: Colors.grey.shade400, size: 30),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.productName,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _showRemoveItemDialog(context, controller, item.productId),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, color: Colors.redAccent, size: 16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${item.price.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            _QuantityButton(
                              icon: Icons.remove_rounded,
                              onTap: () {
                                if (item.quantity > 1) {
                                  controller.updateCartItem(item.productId, item.quantity - 1);
                                } else {
                                  _showRemoveItemDialog(context, controller, item.productId);
                                }
                              },
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                '${item.quantity}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : AppColors.textPrimary,
                                ),
                              ),
                            ),
                            _QuantityButton(
                              icon: Icons.add_rounded,
                              onTap: () => controller.updateCartItem(item.productId, item.quantity + 1),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '₹${item.subtotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryGreen,
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
    );
  }

  Widget _buildCartSummary(dynamic cart, CartController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.shade200, width: 1),
        ),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(30),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Price Summary',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: voucherCodeController,
                      decoration: InputDecoration(
                        hintText: 'Voucher Code',
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                        isDense: true,
                      ),
                      textCapitalization: TextCapitalization.characters,
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      final code = voucherCodeController.text.trim();
                      if (code.isEmpty) return;
                      
                      final validatedVoucher = await voucherController.validateVoucher(code);
                      if (validatedVoucher != null) {
                        setState(() {
                          appliedDiscountPercentage = validatedVoucher.discountPercentage;
                          appliedVoucherCode = validatedVoucher.voucherCode;
                        });
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Apply', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            if (appliedVoucherCode != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.success.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_rounded, color: AppColors.success, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Voucher "$appliedVoucherCode" applied!',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.success,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.success),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        setState(() {
                          appliedDiscountPercentage = null;
                          appliedVoucherCode = null;
                          voucherCodeController.clear();
                        });
                      },
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            _buildSummaryRow('Subtotal', '₹${cart.totalPrice.toStringAsFixed(2)}'),
            const SizedBox(height: 12),
            _buildSummaryRow('GST', '₹${cart.totalGst.toStringAsFixed(2)}'),
            const SizedBox(height: 12),
            _buildSummaryRow('Shipping', '₹${cart.totalShippingCost.toStringAsFixed(2)}'),
            if (appliedDiscountPercentage != null) ...[
              const SizedBox(height: 12),
              _buildSummaryRow(
                'Discount ($appliedDiscountPercentage%)',
                '-₹${(cart.grandTotal * appliedDiscountPercentage! / 100).toStringAsFixed(2)}',
                isDiscount: true,
              ),
            ],
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: _buildSummaryRow(
                'Grand Total',
                '₹${_calculateFinalTotal(cart.grandTotal).toStringAsFixed(2)}',
                isTotal: true,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Get.toNamed('/checkout'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'PROCEED TO CHECKOUT',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  double _calculateFinalTotal(double grandTotal) {
    if (appliedDiscountPercentage != null) {
      return grandTotal - (grandTotal * appliedDiscountPercentage! / 100);
    }
    return grandTotal;
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false, bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? AppColors.textPrimary : (isDiscount ? AppColors.success : AppColors.textSecondary),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            color: isTotal ? AppColors.primaryGreen : (isDiscount ? AppColors.success : AppColors.textPrimary),
          ),
        ),
      ],
    );
  }

  void _showRemoveItemDialog(BuildContext context, CartController controller, int productId) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Are you sure you want to remove this item from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              controller.removeFromCart(productId);
            },
            child: const Text(
              'Remove',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  void _showClearCartDialog(BuildContext context, CartController controller) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text('Are you sure you want to remove all items from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              controller.clearCart();
            },
            child: const Text(
              'Clear All',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            if (isDark == false)
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Icon(icon, size: 18, color: isDark ? Colors.white : AppColors.textPrimary),
      ),
    );
  }
}
