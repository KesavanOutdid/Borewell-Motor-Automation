class CartModel {
  final int? cartId;
  final int userId;
  final List<CartItem> items;
  final double totalPrice;
  final double totalGst;
  final double totalShippingCost;
  final double grandTotal;

  CartModel({
    this.cartId,
    required this.userId,
    required this.items,
    required this.totalPrice,
    required this.totalGst,
    required this.totalShippingCost,
    required this.grandTotal,
  });

  factory CartModel.fromJson(Map<String, dynamic> json) {
    return CartModel(
      cartId: json['cart_id'],
      userId: json['user_id'],
      items: (json['items'] as List?)
          ?.map((item) => CartItem.fromJson(item))
          .toList() ?? [],
      totalPrice: (json['total_price'] ?? 0).toDouble(),
      totalGst: (json['total_gst'] ?? 0).toDouble(),
      totalShippingCost: (json['total_shipping_cost'] ?? 0).toDouble(),
      grandTotal: (json['grand_total'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cart_id': cartId,
      'user_id': userId,
      'items': items.map((item) => item.toJson()).toList(),
      'total_price': totalPrice,
      'total_gst': totalGst,
      'total_shipping_cost': totalShippingCost,
      'grand_total': grandTotal,
    };
  }
}

class CartItem {
  final int productId;
  final String productName;
  final String? productImage;
  final double price;
  final int quantity;
  final double subtotal;
  final double gst;
  final double shippingCost;

  CartItem({
    required this.productId,
    required this.productName,
    this.productImage,
    required this.price,
    required this.quantity,
    required this.subtotal,
    required this.gst,
    required this.shippingCost,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    final price = (json['product_price'] ?? json['price'] ?? 0).toDouble();
    final quantity = json['quantity'] ?? 0;
    final gstPercent = (json['product_gst'] ?? 0).toDouble();
    final shippingCost = (json['product_shipping_cost'] ?? json['shipping_cost'] ?? 0).toDouble();
    
    final subtotal = json['subtotal'] != null 
        ? (json['subtotal']).toDouble() 
        : price * quantity;
    
    final gstAmount = json['gst'] != null 
        ? (json['gst']).toDouble() 
        : (price * quantity * gstPercent / 100);
    
    return CartItem(
      productId: json['product_id'],
      productName: json['product_name'] ?? '',
      productImage: json['product_main_image'] ?? json['product_image'],
      price: price,
      quantity: quantity,
      subtotal: subtotal,
      gst: gstAmount,
      shippingCost: shippingCost,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'product_image': productImage,
      'price': price,
      'quantity': quantity,
      'subtotal': subtotal,
      'gst': gst,
      'shipping_cost': shippingCost,
    };
  }

  CartItem copyWith({
    int? productId,
    String? productName,
    String? productImage,
    double? price,
    int? quantity,
    double? subtotal,
    double? gst,
    double? shippingCost,
  }) {
    return CartItem(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      productImage: productImage ?? this.productImage,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      subtotal: subtotal ?? this.subtotal,
      gst: gst ?? this.gst,
      shippingCost: shippingCost ?? this.shippingCost,
    );
  }
}
