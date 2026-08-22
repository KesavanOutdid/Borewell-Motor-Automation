import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../../utils/theme/app_colors.dart';
import '../../data/models/order_model.dart';
import '../../data/models/cart_model.dart';
import '../../data/models/address_model.dart';
import '../controllers/checkout_controller.dart';
import '../controllers/cart_controller.dart';
import '../controllers/address_controller.dart';

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  final _formKey = GlobalKey<FormState>();
  final checkoutController = Get.put(CheckoutController());
  final cartController = Get.find<CartController>();
  late AddressController addressController;
  
  final fullNameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final streetController = TextEditingController();
  final cityController = TextEditingController();
  final stateController = TextEditingController();
  final pincodeController = TextEditingController();
  
  String selectedPaymentMethod = 'razorpay';
  bool isLoadingPincode = false;
  AddressModel? selectedAddress;
  bool hasModifiedAddress = false;
  
  int? appliedDiscountPercentage;
  String? appliedVoucherCode;
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void initState() {
    super.initState();
    
    appliedDiscountPercentage = Get.arguments?['appliedDiscountPercentage'];
    appliedVoucherCode = Get.arguments?['appliedVoucherCode'];

    addressController = Get.put(AddressController());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      addressController.fetchAddresses();
    });
    
    fullNameController.addListener(_onFieldChanged);
    phoneController.addListener(_onFieldChanged);
    emailController.addListener(_onFieldChanged);
    streetController.addListener(_onFieldChanged);
    cityController.addListener(_onFieldChanged);
    stateController.addListener(_onFieldChanged);
    pincodeController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    if (selectedAddress != null) {
      final isModified = fullNameController.text.trim() != selectedAddress!.fullName ||
          phoneController.text.trim() != selectedAddress!.phone ||
          emailController.text.trim() != selectedAddress!.email ||
          streetController.text.trim() != selectedAddress!.street ||
          cityController.text.trim() != selectedAddress!.city ||
          stateController.text.trim() != selectedAddress!.state ||
          pincodeController.text.trim() != selectedAddress!.pincode;

      if (hasModifiedAddress != isModified) {
        setState(() {
          hasModifiedAddress = isModified;
        });
      }
    }
  }

  @override
  void dispose() {
    fullNameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    streetController.dispose();
    cityController.dispose();
    stateController.dispose();
    pincodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = cartController.cart.value;
    
    if (cart == null || cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text('checkout'.tr)),
        body: Center(
          child: Text('cart_empty'.tr),
        ),
      );
    }

    return Scaffold(
      body: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.disabled,
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
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.arrow_back,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'checkout'.tr,
                                style: const TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: -1.5,
                                  height: 1.1,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'shipping_address'.tr,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white70,
                                  letterSpacing: 0.5,
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 12),
                    _buildSavedAddresses(),
                    SizedBox(height: 16),
                    _buildTextField(
                      controller: fullNameController,
                      label: 'full_name'.tr,
                      icon: Icons.person,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'please_enter_full_name'.tr;
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 12),
                    _buildTextField(
                      controller: phoneController,
                      label: 'phone_number'.tr,
                      icon: Icons.phone,
                      keyboardType: TextInputType.phone,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'please_enter_phone_number'.tr;
                        }
                        if (value.length != 10) {
                          return 'phone_number_must_be_10_digits'.tr;
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 12),
                    _buildTextField(
                      controller: emailController,
                      label: 'email'.tr,
                      icon: Icons.email,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'please_enter_email'.tr;
                        }
                        if (!GetUtils.isEmail(value)) {
                          return 'invalid_email'.tr;
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 12),
                    _buildTextField(
                      controller: streetController,
                      label: 'street_address'.tr,
                      icon: Icons.home,
                      maxLines: 2,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'please_enter_street_address'.tr;
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: pincodeController,
                            label: 'pincode'.tr,
                            icon: Icons.pin_drop,
                            keyboardType: TextInputType.number,
                            onChanged: (value) {
                              if (value.length == 6) {
                                _fetchLocationByPincode(value);
                              }
                            },
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'enter_valid_pincode'.tr;
                              }
                              if (!RegExp(r'^\d{6}$').hasMatch(value)) {
                                return 'enter_valid_pincode'.tr;
                              }
                              return null;
                            },
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: cityController,
                            label: 'city'.tr,
                            icon: Icons.location_city,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'enter_valid_city'.tr;
                              }
                              if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
                                return 'enter_valid_city'.tr;
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12),
                    _buildTextField(
                      controller: stateController,
                      label: 'state'.tr,
                      icon: Icons.map,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'enter_valid_state'.tr;
                        }
                        if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
                          return 'enter_valid_state'.tr;
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 24),
                    _buildSectionTitle('payment_method'.tr),
                    SizedBox(height: 12),
                    _buildPaymentMethodCard(
                      title: 'razorpay'.tr,
                      subtitle: 'razorpay_subtitle'.tr,
                      icon: Icons.payment,
                      value: 'razorpay',
                    ),
                    SizedBox(height: 24),
                    _buildOrderSummary(cart),
                  ],
                ),
              ),
            ),
            _buildBottomBar(cart),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Theme.of(context).textTheme.titleLarge?.color ?? AppColors.textPrimary,
      ),
    );
  }

  void _populateAddressFields(AddressModel address) {
    // Remove listeners to prevent hasModifiedAddress from being set to true
    fullNameController.removeListener(_onFieldChanged);
    phoneController.removeListener(_onFieldChanged);
    emailController.removeListener(_onFieldChanged);
    streetController.removeListener(_onFieldChanged);
    cityController.removeListener(_onFieldChanged);
    stateController.removeListener(_onFieldChanged);
    pincodeController.removeListener(_onFieldChanged);
    
    setState(() {
      selectedAddress = address;
      hasModifiedAddress = false;
      fullNameController.text = address.fullName;
      phoneController.text = address.phone;
      emailController.text = address.email;
      streetController.text = address.street;
      cityController.text = address.city;
      stateController.text = address.state;
      pincodeController.text = address.pincode;
    });
    
    // Add listeners back
    fullNameController.addListener(_onFieldChanged);
    phoneController.addListener(_onFieldChanged);
    emailController.addListener(_onFieldChanged);
    streetController.addListener(_onFieldChanged);
    cityController.addListener(_onFieldChanged);
    stateController.addListener(_onFieldChanged);
    pincodeController.addListener(_onFieldChanged);
  }

  Widget _buildSavedAddresses() {
    return Obx(() {
      if (addressController.isLoading.value) {
        return Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: CircularProgressIndicator(),
          ),
        );
      }

      if (addressController.addresses.isEmpty) {
        return const SizedBox.shrink();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'select_from_saved_addresses'.tr,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).textTheme.bodyMedium?.color ?? AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: addressController.addresses.length,
              itemBuilder: (context, index) {
                final address = addressController.addresses[index];
                final isSelected = selectedAddress?.id == address.id;
                
                return GestureDetector(
                  onTap: () => _populateAddressFields(address),
                  child: Container(
                    width: 200,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSelected ? AppColors.primaryGreen : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade700 : Colors.grey.shade300),
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: isSelected ? AppColors.primaryGreen.withValues(alpha: 0.1) : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 16,
                              color: isSelected ? AppColors.primaryGreen : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600),
                            ),
                            SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                address.fullName,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: isSelected ? AppColors.primaryGreen : (Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 4),
                        Text(
                          '${address.street}, ${address.city}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade300 : Colors.grey.shade700,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          address.pincode,
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    });
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
    Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      onChanged: onChanged,
      autovalidateMode: _autovalidateMode,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primaryGreen),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade700 : Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
        filled: true,
        fillColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade50,
      ),
    );
  }

  Widget _buildPaymentMethodCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required String value,
  }) {
    return InkWell(
      onTap: () {
        setState(() {
          selectedPaymentMethod = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: selectedPaymentMethod == value 
                ? AppColors.primaryGreen 
                : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade700 : Colors.grey.shade300),
            width: selectedPaymentMethod == value ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: selectedPaymentMethod == value 
              ? AppColors.primaryGreen.withValues(alpha: 0.05)
              : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: selectedPaymentMethod == value 
                    ? AppColors.primaryGreen 
                    : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: selectedPaymentMethod == value 
                    ? Colors.white 
                    : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: selectedPaymentMethod == value 
                          ? AppColors.primaryGreen 
                          : (Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: selectedPaymentMethod,
              onChanged: (val) {
                setState(() {
                  selectedPaymentMethod = val!;
                });
              },
              activeColor: AppColors.primaryGreen,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary(CartModel cart) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade700 : Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('order_summary'.tr,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).textTheme.titleLarge?.color ?? AppColors.textPrimary,
            ),
          ),
          const Divider(height: 24),
          _buildSummaryRow('Items', '${cart.items.length}'),
          SizedBox(height: 8),
          _buildSummaryRow('Subtotal', '₹${cart.totalPrice.toStringAsFixed(2)}'),
          SizedBox(height: 8),
          _buildSummaryRow('GST', '₹${cart.totalGst.toStringAsFixed(2)}'),
          SizedBox(height: 8),
          _buildSummaryRow('Shipping', '₹${cart.totalShippingCost.toStringAsFixed(2)}'),
          if (appliedDiscountPercentage != null) ...[
            SizedBox(height: 8),
            _buildSummaryRow(
              'Discount ($appliedDiscountPercentage%)',
              '-₹${(cart.totalPrice * appliedDiscountPercentage! / 100).toStringAsFixed(2)}',
            ),
          ],
          const Divider(height: 24),
          _buildSummaryRow(
            'Total',
            '₹${_calculateFinalTotal(cart.grandTotal, cart.totalPrice).toStringAsFixed(2)}',
            isTotal: true,
          ),
        ],
      ),
    );
  }

  double _calculateFinalTotal(double grandTotal, double totalPrice) {
    if (appliedDiscountPercentage != null) {
      return grandTotal - (totalPrice * appliedDiscountPercentage! / 100);
    }
    return grandTotal;
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? (Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary) : (Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade300 : Colors.grey.shade700),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            color: isTotal ? AppColors.primaryGreen : (Theme.of(context).textTheme.titleMedium?.color ?? AppColors.textPrimary),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(CartModel cart) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.black.withValues(alpha: 0.3) : Colors.grey.shade300,
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: SafeArea(
        child: Obx(() {
          return SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: checkoutController.isProcessing.value
                  ? null
                  : () => _placeOrder(cart),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                disabledBackgroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade700 : Colors.grey.shade400,
              ),
              child: checkoutController.isProcessing.value
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      'Place Order',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          );
        }),
      ),
    );
  }

  Future<void> _placeOrder(CartModel cart) async {
    setState(() {
      _autovalidateMode = AutovalidateMode.onUserInteraction;
    });
    
    if (_formKey.currentState!.validate()) {
      final userId = addressController.tokenService.getUserId();
      final currentFullName = fullNameController.text.trim();
      final currentPhone = phoneController.text.trim();
      final currentEmail = emailController.text.trim();
      final currentStreet = streetController.text.trim();
      final currentCity = cityController.text.trim();
      final currentState = stateController.text.trim();
      final currentPincode = pincodeController.text.trim();

      // Check if this exact address already exists in saved addresses
      final existingAddressMatch = addressController.addresses.firstWhereOrNull(
        (addr) => 
            addr.fullName == currentFullName &&
            addr.phone == currentPhone &&
            addr.email == currentEmail &&
            addr.street == currentStreet &&
            addr.city == currentCity &&
            addr.state == currentState &&
            addr.pincode == currentPincode
      );

      if (existingAddressMatch == null) {
        // Only create a new address if no match was found
        final now = DateTime.now();
        final newAddress = AddressModel(
          userId: userId ?? 0,
          fullName: currentFullName,
          phone: currentPhone,
          email: currentEmail,
          street: currentStreet,
          city: currentCity,
          state: currentState,
          pincode: currentPincode,
          country: 'India',
          isDefault: addressController.addresses.isEmpty,
          createdAt: now,
          updatedAt: now,
        );
        
        await addressController.createAddress(newAddress);
      }

      final shippingAddress = ShippingAddress(
        fullName: currentFullName,
        phone: currentPhone,
        email: currentEmail,
        street: currentStreet,
        city: currentCity,
        state: currentState,
        pincode: currentPincode,
        country: 'India',
      );

      checkoutController.createOrder(
        cart: cart,
        shippingAddress: shippingAddress,
        paymentMethod: selectedPaymentMethod,
        appliedVoucherCode: appliedVoucherCode,
        appliedDiscountPercentage: appliedDiscountPercentage,
      );
    }
  }

  Future<void> _fetchLocationByPincode(String pincode) async {
    if (pincode.length != 6) return;

    setState(() => isLoadingPincode = true);

    try {
      final response = await http.get(
        Uri.parse('https://api.postalpincode.in/pincode/$pincode'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        
        if (data.isNotEmpty && data[0]['Status'] == 'Success') {
          final postOffice = data[0]['PostOffice'][0];
          
          setState(() {
            stateController.text = postOffice['State'] ?? '';
            cityController.text = postOffice['District'] ?? '';
          });

          Get.snackbar(
            'Success',
            'Location details auto-filled',
            snackPosition: SnackPosition.TOP,
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: const Duration(seconds: 2),
          );
        } else {
          Get.snackbar(
            'Invalid Pincode',
            'Please enter a valid pincode',
            snackPosition: SnackPosition.TOP,
            backgroundColor: Colors.red,
            colorText: Colors.white,
          );
        }
      }
    } catch (e) {
      print('Error fetching pincode data: $e');
    } finally {
      setState(() => isLoadingPincode = false);
    }
  }
}
