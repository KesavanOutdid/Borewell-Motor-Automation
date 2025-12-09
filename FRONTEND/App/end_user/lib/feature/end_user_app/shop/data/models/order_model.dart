class OrderModel {
  final String orderId;
  final int userId;
  final String userEmail;
  final List<OrderItem> cartItems;
  final ShippingAddress shippingAddress;
  final OrderSummary orderSummary;
  final String paymentMethod;
  final String paymentStatus;
  final String orderStatus;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final String? razorpaySignature;
  final String? cancellationReason;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<OrderTimelineItem> orderTimeline;

  OrderModel({
    required this.orderId,
    required this.userId,
    required this.userEmail,
    required this.cartItems,
    required this.shippingAddress,
    required this.orderSummary,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.orderStatus,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.razorpaySignature,
    this.cancellationReason,
    required this.createdAt,
    this.updatedAt,
    this.orderTimeline = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      orderId: json['order_id'] ?? '',
      userId: json['user_id'] ?? 0,
      userEmail: json['user_email'] ?? '',
      cartItems: (json['cart_items'] as List?)
          ?.map((item) => OrderItem.fromJson(item))
          .toList() ?? [],
      shippingAddress: ShippingAddress.fromJson(json['shipping_address'] ?? {}),
      orderSummary: OrderSummary.fromJson(json['order_summary'] ?? {}),
      paymentMethod: json['payment_method'] ?? 'cod',
      paymentStatus: json['payment_status'] ?? 'pending',
      orderStatus: json['order_status'] ?? 'pending',
      razorpayOrderId: json['razorpay_order_id'],
      razorpayPaymentId: json['razorpay_payment_id'],
      razorpaySignature: json['razorpay_signature'],
      cancellationReason: json['cancellation_reason'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
      orderTimeline: (json['order_timeline'] as List?)
          ?.map((item) => OrderTimelineItem.fromJson(item))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'user_id': userId,
      'user_email': userEmail,
      'cart_items': cartItems.map((item) => item.toJson()).toList(),
      'shipping_address': shippingAddress.toJson(),
      'order_summary': orderSummary.toJson(),
      'payment_method': paymentMethod,
      'payment_status': paymentStatus,
      'order_status': orderStatus,
      'razorpay_order_id': razorpayOrderId,
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_signature': razorpaySignature,
      'cancellation_reason': cancellationReason,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'order_timeline': orderTimeline.map((item) => item.toJson()).toList(),
    };
  }
}

class OrderItem {
  final int productId;
  final String productName;
  final double productPrice;
  final double productGst;
  final double productShippingCost;
  final int quantity;
  final String? productMainImage;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.productPrice,
    required this.productGst,
    required this.productShippingCost,
    required this.quantity,
    this.productMainImage,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['product_id'] ?? 0,
      productName: json['product_name'] ?? '',
      productPrice: (json['product_price'] ?? 0).toDouble(),
      productGst: (json['product_gst'] ?? 0).toDouble(),
      productShippingCost: (json['product_shipping_cost'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      productMainImage: json['product_main_image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'product_price': productPrice,
      'product_gst': productGst,
      'product_shipping_cost': productShippingCost,
      'quantity': quantity,
      'product_main_image': productMainImage,
    };
  }
}

class ShippingAddress {
  final String fullName;
  final String phone;
  final String email;
  final String street;
  final String city;
  final String state;
  final String pincode;
  final String country;

  ShippingAddress({
    required this.fullName,
    required this.phone,
    required this.email,
    required this.street,
    required this.city,
    required this.state,
    required this.pincode,
    this.country = 'India',
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      fullName: json['full_name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      country: json['country'] ?? 'India',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'full_name': fullName,
      'phone': phone,
      'email': email,
      'street': street,
      'city': city,
      'state': state,
      'pincode': pincode,
      'country': country,
    };
  }
}

class OrderSummary {
  final double totalPrice;
  final double totalGst;
  final double totalShippingCost;
  final double grandTotal;

  OrderSummary({
    required this.totalPrice,
    required this.totalGst,
    required this.totalShippingCost,
    required this.grandTotal,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      totalPrice: (json['total_price'] ?? 0).toDouble(),
      totalGst: (json['total_gst'] ?? 0).toDouble(),
      totalShippingCost: (json['total_shipping_cost'] ?? 0).toDouble(),
      grandTotal: (json['grand_total'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_price': totalPrice,
      'total_gst': totalGst,
      'total_shipping_cost': totalShippingCost,
      'grand_total': grandTotal,
    };
  }
}

class OrderTimelineItem {
  final String status;
  final String message;
  final DateTime timestamp;
  final String updatedBy;

  OrderTimelineItem({
    required this.status,
    required this.message,
    required this.timestamp,
    required this.updatedBy,
  });

  factory OrderTimelineItem.fromJson(Map<String, dynamic> json) {
    return OrderTimelineItem(
      status: json['status'] ?? '',
      message: json['message'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      updatedBy: json['updated_by'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'updated_by': updatedBy,
    };
  }
}
