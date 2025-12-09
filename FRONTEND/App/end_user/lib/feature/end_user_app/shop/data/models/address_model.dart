class AddressModel {
  final int? id;
  final int userId;
  final String fullName;
  final String phone;
  final String email;
  final String street;
  final String city;
  final String state;
  final String pincode;
  final String country;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;

  AddressModel({
    this.id,
    required this.userId,
    required this.fullName,
    required this.phone,
    required this.email,
    required this.street,
    required this.city,
    required this.state,
    required this.pincode,
    this.country = 'India',
    this.isDefault = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['address_id'],
      userId: json['user_id'] ?? 0,
      fullName: json['full_name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      street: json['street'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      country: json['country'] ?? 'India',
      isDefault: json['is_default'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'address_id': id,
      'user_id': userId,
      'full_name': fullName,
      'phone': phone,
      'email': email,
      'street': street,
      'city': city,
      'state': state,
      'pincode': pincode,
      'country': country,
      'is_default': isDefault,
    };
  }

  AddressModel copyWith({
    int? id,
    int? userId,
    String? fullName,
    String? phone,
    String? email,
    String? street,
    String? city,
    String? state,
    String? pincode,
    String? country,
    bool? isDefault,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AddressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      street: street ?? this.street,
      city: city ?? this.city,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
      country: country ?? this.country,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get fullAddress {
    return '$street, $city, $state - $pincode';
  }
}
