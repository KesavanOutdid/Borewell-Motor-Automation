import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:agri_plus/utils/ui_utils.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';
import '../controllers/shop_controller.dart';
import '../controllers/cart_controller.dart';
import '../../data/models/cart_model.dart';
import 'cart_page.dart';

class ProductDetailsView extends StatefulWidget {
  const ProductDetailsView({super.key});

  @override
  State<ProductDetailsView> createState() => _ProductDetailsViewState();
}

class _ProductDetailsViewState extends State<ProductDetailsView> {
  int _selectedImageIndex = 0;
  int _quantity = 1;
  late Map<String, dynamic> product;
  late ShopController controller;
  late CartController cartController;

  @override
  void initState() {
    super.initState();
    product = Get.arguments as Map<String, dynamic>;
    controller = Get.find<ShopController>();
    cartController = Get.find<CartController>();
    
    // Initialize quantity from cart if product is already there
    final productId = product['product_id'];
    final cartItem = cartController.cart.value?.items.firstWhereOrNull((item) => item.productId == productId);
    if (cartItem != null) {
      _quantity = cartItem.quantity;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    
    final mainImage = product['product_main_image'] ?? '';
    final subImages = (product['product_sub_images'] as List<dynamic>?)?.cast<String>() ?? [];
    final List<String> allImages = [mainImage, ...subImages];
    
    final productName = product['product_name'] ?? 'Product';
    final productDescription = product['product_description'] ?? '';
    final productPrice = product['product_price']?.toString() ?? '0';
    final productGstPercent = product['product_gst']?.toString() ?? '0';
    final productShipping = product['product_shipping_cost']?.toString() ?? '0';
    final productQuantity = product['product_quantity'] ?? 0;
    final isOutOfStock = productQuantity <= 0;
    final productQuality = product['product_quality'] as Map<String, dynamic>?;
    final productPdf = product['product_description_pdf'];
    
    final priceValue = double.tryParse(productPrice) ?? 0;
    final gstPercent = double.tryParse(productGstPercent) ?? 0;
    final shippingValue = double.tryParse(productShipping) ?? 0;
    final gstAmount = priceValue * (gstPercent / 100);
    final totalPrice = (priceValue + gstAmount + shippingValue) * _quantity;

    return Scaffold(
      appBar: AppBar(
        title: Text('product_details_label'.tr),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareProduct(productName, productPrice),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildImageGallery(allImages, controller, isOutOfStock),
                  const SizedBox(height: 16),
                  if (!isOutOfStock) ...[
                    _buildQuantitySelector(),
                    const SizedBox(height: 16),
                  ],
                  if (isOutOfStock) ...[
                    _buildOutOfStockBanner(),
                    const SizedBox(height: 16),
                  ],
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          productName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Text(
                              '₹$productPrice',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '${'gst'.tr}: $productGstPercent%',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.success,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${'gst_amount'.tr}: ₹${gstAmount.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${'shipping'.tr}: ₹$productShipping',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Divider(),
                        const SizedBox(height: 12),
                        Text(
                          'description'.tr,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          productDescription,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                            height: 1.5,
                          ),
                        ),
                        if (productPdf != null && productPdf.toString().isNotEmpty) ...[
                          const SizedBox(height: 16),
                          GradientButton(
                            text: 'view_pdf_brochure'.tr,
                            icon: Icons.picture_as_pdf,
                            onPressed: () => _openPdf(controller.getImageUrl(productPdf.toString())),
                            height: 48,
                          ),
                        ],
                        if (productQuality != null) ...[
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 12),
                          Text(
                            'product_details_label'.tr,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildDetailRow('box_size'.tr, productQuality['box_size']?.toString() ?? 'N/A'),
                          const SizedBox(height: 8),
                          _buildDetailRow('details'.tr, productQuality['extra_details']?.toString() ?? 'N/A'),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          _buildBottomBar(product, totalPrice, cartController, isOutOfStock),
        ],
      ),
    );
  }

  Future<void> _openPdf(String pdfUrl) async {
    if (pdfUrl.isEmpty) {
      UIUtils.showErrorSnackbar(
        title: 'error'.tr,
        message: 'pdf_not_available'.tr,
      );
      return;
    }

    try {
      final uri = Uri.parse(pdfUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
      } else {
        UIUtils.showErrorSnackbar(
          title: 'error'.tr,
          message: 'cannot_open_pdf'.tr,
        );
      }
    } catch (e) {
      UIUtils.showErrorSnackbar(
        title: 'error'.tr,
        message: '${'cannot_open_pdf'.tr}: $e',
      );
    }
  }

  Future<void> _shareProduct(String productName, String productPrice) async {
    try {
      final shareText = '''
Check out this product from AgriPlus!

$productName
Price: ₹$productPrice

Get yours now from our app!
''';
      
      await Share.share(
        shareText,
        subject: productName,
      );
    } catch (e) {
      UIUtils.showErrorSnackbar(
        title: 'error'.tr,
        message: 'failed_to_share_product'.tr,
      );
    }
  }

  Widget _buildImageGallery(List<String> images, ShopController controller, bool isOutOfStock) {
    if (images.isEmpty || images.first.isEmpty) {
      return Container(
        height: 300,
        color: Colors.grey.shade200,
        child: const Center(
          child: Icon(Icons.image_not_supported, size: 80, color: Colors.grey),
        ),
      );
    }

    return Column(
      children: [
        Stack(
          children: [
            Container(
              height: 300,
              width: double.infinity,
              color: Colors.grey.shade100,
              child: Image.network(
                controller.getImageUrl(images[_selectedImageIndex]),
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const Center(
                    child: Icon(Icons.image_not_supported, size: 80, color: Colors.grey),
                  );
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Center(child: CircularProgressIndicator());
                },
              ),
            ),
            if (isOutOfStock)
              Container(
                height: 300,
                width: double.infinity,
                color: Colors.black.withValues(alpha: 0.6),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.remove_shopping_cart,
                        size: 60,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'out_of_stock'.tr,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        if (images.length > 1) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: images.length,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedImageIndex = index;
                    });
                  },
                  child: Container(
                    width: 80,
                    height: 80,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _selectedImageIndex == index
                            ? AppColors.primaryGreen
                            : Colors.grey.shade300,
                        width: _selectedImageIndex == index ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(7),
                      child: Image.network(
                        controller.getImageUrl(images[index]),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.image, color: Colors.grey),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        const Text(': ', style: TextStyle(fontSize: 14)),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuantitySelector() {
    final int availableStock = product['product_quantity'] ?? 0;
    final productId = product['product_id'];

    return Obx(() {
      // Sync UI if cart changes while we are on this page
      final cartItem = cartController.cart.value?.items.firstWhereOrNull((item) => item.productId == productId);
      final cartQuantity = cartItem?.quantity ?? 0;

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'quantity'.tr,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 16),
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.primaryGreen),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove, size: 20),
                        onPressed: () {
                          if (_quantity > 1) {
                            setState(() {
                              _quantity--;
                            });
                          }
                        },
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 40,
                          minHeight: 40,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          '$_quantity',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add, size: 20),
                        onPressed: (_quantity < availableStock && _quantity < 3)
                          ? () {
                                  setState(() {
                                    _quantity++;
                                  });
                                }
                          : null,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 40,
                          minHeight: 40,
                        ),
                        color: (_quantity < availableStock && _quantity < 3) ? AppColors.primaryGreen : Colors.grey,
                      ),
                    ],
                  ),
                ),
                if (cartQuantity > 0) ...[
                  const SizedBox(width: 12),
                  Text(
                    '($cartQuantity in cart)',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${'available_stock'.tr}: $availableStock units',
              style: TextStyle(
                fontSize: 13,
                color: availableStock < 5 ? Colors.red : Colors.grey.shade600,
                fontWeight: availableStock < 5 ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildOutOfStockBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          border: Border.all(color: Colors.red.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.info_outline,
              color: Colors.red.shade700,
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'currently_unavailable'.tr,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.red.shade700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'out_of_stock_desc'.tr,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.red.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(Map<String, dynamic> product, double totalPrice, CartController cartController, bool isOutOfStock) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (!isOutOfStock)
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'total_price'.tr,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    Text(
                      '₹${totalPrice.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                  ],
                ),
              ),
            if (!isOutOfStock) const SizedBox(width: 16),
            Expanded(
              child: isOutOfStock
                  ? Container(
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.remove_shopping_cart,
                              color: Colors.grey.shade700,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'out_of_stock'.tr,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Obx(() {
                      final productId = product['product_id'];
                      final cartItem = cartController.cart.value?.items.firstWhereOrNull((item) => item.productId == productId);
                      final bool isInCart = cartItem != null;
                      final bool isNoChange = isInCart && cartItem.quantity == _quantity;
                      
                      return GradientButton(
                        text: isInCart ? (isNoChange ? 'view_cart'.tr : 'update_cart'.tr) : 'add_to_cart'.tr,
                        icon: isInCart ? Icons.shopping_cart_checkout : Icons.shopping_cart,
                        onPressed: () async {
                          if (isNoChange) {
                            Get.to(() => const CartPage());
                            return;
                          }
                          if (productId != null) {
                            bool success;
                            if (isInCart) {
                              success = await cartController.updateCartItem(productId, _quantity);
                            } else {
                              final productData = CartItem(
                                productId: productId,
                                productName: product['product_name'] ?? '',
                                productImage: product['product_main_image'] ?? '',
                                price: double.tryParse(product['product_price']?.toString() ?? '0') ?? 0,
                                quantity: _quantity,
                                subtotal: (double.tryParse(product['product_price']?.toString() ?? '0') ?? 0) * _quantity,
                                gst: double.tryParse(product['product_gst']?.toString() ?? '0') ?? 0,
                                shippingCost: double.tryParse(product['product_shipping_cost']?.toString() ?? '0') ?? 0,
                              );
                              success = await cartController.addToCart(productId, _quantity, productData: productData);
                            }
                            
                            if (success) {
                              _showAddToCartSuccess(isUpdate: isInCart);
                            }
                          }
                        },
                        height: 50,
                      );
                    }),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddToCartSuccess({bool isUpdate = false}) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: AppColors.success,
                  size: 48,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                isUpdate ? 'cart_updated'.tr : 'added_to_cart'.tr,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isUpdate ? 'cart_updated_desc'.tr : 'added_to_cart_desc'.tr,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context, rootNavigator: true).pop();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: AppColors.primaryGreen),
                        foregroundColor: AppColors.primaryGreen,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shopping_bag_outlined, size: 18),
                          const SizedBox(width: 6),
                          Text('continue'.tr, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context, rootNavigator: true).pop();
                        Get.to(() => const CartPage());
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shopping_cart, size: 18),
                          const SizedBox(width: 6),
                          Text('view_cart'.tr, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      isDismissible: true,
      enableDrag: true,
    );
  }
}
