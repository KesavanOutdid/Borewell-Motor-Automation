import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../core/services/token_service.dart';
import '../controllers/address_controller.dart';
import '../../data/models/address_model.dart';

class AddEditAddressPage extends StatefulWidget {
  const AddEditAddressPage({super.key});

  @override
  State<AddEditAddressPage> createState() => _AddEditAddressPageState();
}

class _AddEditAddressPageState extends State<AddEditAddressPage> {
  final _formKey = GlobalKey<FormState>();
  final controller = Get.find<AddressController>();
  final tokenService = Get.find<TokenService>();

  late TextEditingController fullNameController;
  late TextEditingController phoneController;
  late TextEditingController emailController;
  late TextEditingController streetController;
  late TextEditingController cityController;
  late TextEditingController stateController;
  late TextEditingController pincodeController;

  bool isLoadingPincode = false;
  bool hasChanges = false;
  AddressModel? existingAddress;
  bool isEditMode = false;

  @override
  void initState() {
    super.initState();
    
    existingAddress = Get.arguments as AddressModel?;
    isEditMode = existingAddress != null;

    fullNameController = TextEditingController(text: existingAddress?.fullName ?? '');
    phoneController = TextEditingController(text: existingAddress?.phone ?? '');
    emailController = TextEditingController(text: existingAddress?.email ?? tokenService.getUserEmail() ?? '');
    streetController = TextEditingController(text: existingAddress?.street ?? '');
    cityController = TextEditingController(text: existingAddress?.city ?? '');
    stateController = TextEditingController(text: existingAddress?.state ?? '');
    pincodeController = TextEditingController(text: existingAddress?.pincode ?? '');
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

  bool _hasFieldsChanged() {
    if (!isEditMode) return true;

    final originalAddress = existingAddress!;
    
    return fullNameController.text.trim() != (originalAddress.fullName ?? '') ||
        phoneController.text.trim() != (originalAddress.phone ?? '') ||
        emailController.text.trim() != (originalAddress.email ?? '') ||
        streetController.text.trim() != (originalAddress.street ?? '') ||
        cityController.text.trim() != (originalAddress.city ?? '') ||
        stateController.text.trim() != (originalAddress.state ?? '') ||
        pincodeController.text.trim() != (originalAddress.pincode ?? '');
  }

  void _onFieldChanged() {
    setState(() {
      hasChanges = _hasFieldsChanged();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEditMode ? 'Edit Address' : 'Add Address'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildTextField(
              controller: fullNameController,
              label: 'Full Name',
              icon: Icons.person,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter full name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: phoneController,
              label: 'Phone',
              icon: Icons.phone,
              keyboardType: TextInputType.phone,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter phone number';
                }
                if (value.length != 10) {
                  return 'Phone number must be 10 digits';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: emailController,
              label: 'Email',
              icon: Icons.email,
              keyboardType: TextInputType.emailAddress,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter email';
                }
                if (!GetUtils.isEmail(value)) {
                  return 'Please enter valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: streetController,
              label: 'Street Address',
              icon: Icons.home,
              maxLines: 2,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter street address';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: pincodeController,
                    label: 'Pincode',
                    icon: Icons.pin_drop,
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      _onFieldChanged();
                      if (value.length == 6) {
                        _fetchLocationByPincode(value);
                      }
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Enter valid pincode';
                      }
                      if (!RegExp(r'^\d{6}$').hasMatch(value)) {
                        return 'Enter valid pincode';
                      }
                      return null;
                    },
                  ),
                ),
                if (isLoadingPincode) ...[
                  const SizedBox(width: 12),
                  const CircularProgressIndicator(),
                ],
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: cityController,
              label: 'City/District',
              icon: Icons.location_city,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Enter valid city name';
                }
                if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
                  return 'Enter valid city name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: stateController,
              label: 'State',
              icon: Icons.map,
              onChanged: (_) => _onFieldChanged(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Enter valid state name';
                }
                if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) {
                  return 'Enter valid state name';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            const SizedBox(height: 32),
            Obx(() {
              final isButtonDisabled = isEditMode && !hasChanges;
              
              return ElevatedButton(
                onPressed: (controller.isLoading.value || isButtonDisabled) ? null : _saveAddress,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: controller.isLoading.value
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        isEditMode ? 'Update Address' : 'Save Address',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int? maxLines,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines ?? 1,
      validator: validator,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
        ),
      ),
    );
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
            'Location auto-filled',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white,
            duration: const Duration(seconds: 2),
          );
        }
      }
    } catch (e) {
      // Silent fail
    } finally {
      setState(() => isLoadingPincode = false);
    }
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final userId = tokenService.getUserId();
    if (userId == null) return;

    final address = AddressModel(
      id: existingAddress?.id,
      userId: userId,
      fullName: fullNameController.text.trim(),
      phone: phoneController.text.trim(),
      email: emailController.text.trim(),
      street: streetController.text.trim(),
      city: cityController.text.trim(),
      state: stateController.text.trim(),
      pincode: pincodeController.text.trim(),
      country: 'India',
      isDefault: false,
      createdAt: existingAddress?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );

    bool success;
    if (isEditMode) {
      success = await controller.updateAddress(address);
    } else {
      success = await controller.createAddress(address);
    }

    if (success && mounted) {
      Navigator.of(context).pop();
    }
  }
}
