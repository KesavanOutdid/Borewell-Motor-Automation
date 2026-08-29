# Flutter Form Management & TextEditingController Pattern

## Overview
This document describes the form management techniques and controller patterns used in Flutter applications, specifically demonstrated in the checkout page and add/edit address page implementations.

---

## Core Concepts

### 1. TextEditingController
A controller for managing text input in Flutter. It allows you to:
- Read and write text field values
- Listen to changes
- Select text programmatically
- Control cursor position

### 2. GlobalKey<FormState>
A key that provides access to the form's state for:
- Form validation
- Saving form data
- Resetting form fields

### 3. Listeners
Callbacks that trigger when controller values change, useful for:
- Detecting user input
- Triggering side effects
- Tracking form modifications

---

## Implementation Pattern

### 1. Basic Setup

```dart
class CheckoutPage extends StatefulWidget {
  const CheckoutPage({super.key});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  // Form key for validation
  final _formKey = GlobalKey<FormState>();
  
  // Text editing controllers for each field
  final fullNameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final streetController = TextEditingController();
  final cityController = TextEditingController();
  final stateController = TextEditingController();
  final pincodeController = TextEditingController();
  
  // State variables
  bool hasModifiedAddress = false;
  AddressModel? selectedAddress;

  @override
  void initState() {
    super.initState();
    
    // Add listeners to all controllers
    fullNameController.addListener(_onFieldChanged);
    phoneController.addListener(_onFieldChanged);
    emailController.addListener(_onFieldChanged);
    streetController.addListener(_onFieldChanged);
    cityController.addListener(_onFieldChanged);
    stateController.addListener(_onFieldChanged);
    pincodeController.addListener(_onFieldChanged);
  }

  @override
  void dispose() {
    // Always dispose controllers to prevent memory leaks
    fullNameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    streetController.dispose();
    cityController.dispose();
    stateController.dispose();
    pincodeController.dispose();
    super.dispose();
  }
}
```

**Key Points:**
- Controllers are declared as `final` instance variables
- Listeners are added in `initState()`
- Controllers MUST be disposed in `dispose()` to prevent memory leaks
- Use descriptive names for controllers (e.g., `fullNameController` not `controller1`)

---

### 2. Form Wrapper

```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(title: const Text('Checkout')),
    body: Form(
      key: _formKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildTextField(
            controller: fullNameController,
            label: 'Full Name',
            icon: Icons.person,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter full name';
              }
              return null;
            },
          ),
          // More fields...
        ],
      ),
    ),
  );
}
```

**AutovalidateMode Options:**
- `AutovalidateMode.disabled` - No automatic validation
- `AutovalidateMode.always` - Validate on every change
- `AutovalidateMode.onUserInteraction` - Validate after first interaction (recommended)

---

### 3. Text Field Builder Pattern

```dart
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
    decoration: InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: AppColors.primaryGreen),
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
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red),
      ),
      filled: true,
      fillColor: Colors.grey.shade50,
    ),
  );
}
```

**Benefits:**
- Consistent styling across all fields
- Reusable component
- Easy to maintain and update
- Reduces code duplication

---

### 4. Validation Patterns

#### Phone Number Validation
```dart
_buildTextField(
  controller: phoneController,
  label: 'Phone Number',
  icon: Icons.phone,
  keyboardType: TextInputType.phone,
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
```

#### Email Validation
```dart
_buildTextField(
  controller: emailController,
  label: 'Email',
  icon: Icons.email,
  keyboardType: TextInputType.emailAddress,
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Please enter email';
    }
    if (!GetUtils.isEmail(value)) {  // Using GetX utility
      return 'Please enter valid email';
    }
    return null;
  },
),
```

#### Pincode Validation with Auto-Fill
```dart
_buildTextField(
  controller: pincodeController,
  label: 'Pincode',
  icon: Icons.pin_drop,
  keyboardType: TextInputType.number,
  onChanged: (value) {
    if (value.length == 6) {
      _fetchLocationByPincode(value);  // Auto-fill city and state
    }
  },
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Required';
    }
    if (value.length != 6) {
      return 'Invalid';
    }
    return null;
  },
),
```

---

### 5. Change Detection Pattern

This is a crucial technique for detecting when a user modifies a form field versus when the app programmatically sets values.

```dart
// State variable to track modifications
bool hasModifiedAddress = false;
AddressModel? selectedAddress;

// Listener callback
void _onFieldChanged() {
  if (selectedAddress != null) {
    hasModifiedAddress = true;
  }
}

// In initState
fullNameController.addListener(_onFieldChanged);
phoneController.addListener(_onFieldChanged);
// ... add to all controllers
```

**Use Cases:**
- Detecting if user modified a pre-filled address
- Warning users about unsaved changes
- Enabling/disabling save buttons
- Triggering auto-save functionality

---

### 6. Programmatic Value Setting (Critical Pattern)

When populating form fields programmatically (e.g., from a saved address), you must temporarily remove listeners to avoid false change detection:

```dart
void _populateAddressFields(AddressModel address) {
  // STEP 1: Remove all listeners
  fullNameController.removeListener(_onFieldChanged);
  phoneController.removeListener(_onFieldChanged);
  emailController.removeListener(_onFieldChanged);
  streetController.removeListener(_onFieldChanged);
  cityController.removeListener(_onFieldChanged);
  stateController.removeListener(_onFieldChanged);
  pincodeController.removeListener(_onFieldChanged);
  
  // STEP 2: Update state and set values
  setState(() {
    selectedAddress = address;
    hasModifiedAddress = false;  // Reset modification flag
    fullNameController.text = address.fullName;
    phoneController.text = address.phone;
    emailController.text = address.email;
    streetController.text = address.street;
    cityController.text = address.city;
    stateController.text = address.state;
    pincodeController.text = address.pincode;
  });
  
  // STEP 3: Add listeners back
  fullNameController.addListener(_onFieldChanged);
  phoneController.addListener(_onFieldChanged);
  emailController.addListener(_onFieldChanged);
  streetController.addListener(_onFieldChanged);
  cityController.addListener(_onFieldChanged);
  stateController.addListener(_onFieldChanged);
  pincodeController.addListener(_onFieldChanged);
}
```

**Why This Pattern?**
1. **Prevents False Positives** - Setting `controller.text` triggers listeners
2. **Maintains Clean State** - `hasModifiedAddress` stays false for programmatic changes
3. **User Intent Tracking** - Only real user input sets `hasModifiedAddress = true`

---

### 7. Form Submission

```dart
Future<void> _submitForm() async {
  // Validate all fields
  if (!_formKey.currentState!.validate()) {
    return;  // Stop if validation fails
  }

  // Get values from controllers
  final address = AddressModel(
    userId: userId,
    fullName: fullNameController.text.trim(),
    phone: phoneController.text.trim(),
    email: emailController.text.trim(),
    street: streetController.text.trim(),
    city: cityController.text.trim(),
    state: stateController.text.trim(),
    pincode: pincodeController.text.trim(),
    country: 'India',
    isDefault: isDefault,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  // Submit to API
  final success = await controller.createAddress(address);

  if (success && mounted) {
    Navigator.of(context).pop();
  }
}
```

**Best Practices:**
- Always validate before submission
- Use `.trim()` to remove whitespace
- Check `mounted` before navigation
- Handle loading states
- Show appropriate error/success messages

---

### 8. Integration with GetX State Management

```dart
class _CheckoutPageState extends State<CheckoutPage> {
  final checkoutController = Get.put(CheckoutController());
  final cartController = Get.find<CartController>();
  late AddressController addressController;

  @override
  void initState() {
    super.initState();
    addressController = Get.put(AddressController());
    
    // Fetch data after frame is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      addressController.fetchAddresses();
    });
  }
}
```

**Combining Controllers:**
- **TextEditingController** - Manages local form input
- **GetX Controller** - Manages app state and API calls
- **State Variables** - Manages local UI state

---

### 9. Saved Addresses Selection Pattern

```dart
Widget _buildSavedAddresses() {
  return Obx(() {
    if (addressController.isLoading.value) {
      return const CircularProgressIndicator();
    }

    if (addressController.addresses.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
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
              // Address card UI with selection indicator
              decoration: BoxDecoration(
                border: Border.all(
                  color: isSelected ? AppColors.primaryGreen : Colors.grey,
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Text(address.fullAddress),
            ),
          );
        },
      ),
    );
  });
}
```

**Pattern Benefits:**
- Users can quickly select saved addresses
- Prevents re-typing common information
- Enhances user experience
- Still allows manual editing

---

## Advanced Techniques

### 1. Controller Value Access

```dart
// Read current value
String name = fullNameController.text;

// Set value programmatically
fullNameController.text = 'John Doe';

// Clear value
fullNameController.clear();

// Get selection
TextSelection selection = fullNameController.selection;

// Check if empty
bool isEmpty = fullNameController.text.isEmpty;
```

### 2. Focus Management

```dart
class _MyFormState extends State<MyForm> {
  final nameFocusNode = FocusNode();
  final emailFocusNode = FocusNode();

  @override
  void dispose() {
    nameFocusNode.dispose();
    emailFocusNode.dispose();
    super.dispose();
  }

  void _submitName() {
    // Move focus to next field
    emailFocusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextFormField(
          focusNode: nameFocusNode,
          onFieldSubmitted: (_) => _submitName(),
        ),
        TextFormField(
          focusNode: emailFocusNode,
        ),
      ],
    );
  }
}
```

### 3. Custom Validation Messages

```dart
String? _validatePhone(String? value) {
  if (value == null || value.isEmpty) {
    return 'Phone number is required';
  }
  
  final cleaned = value.replaceAll(RegExp(r'\D'), '');
  
  if (cleaned.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  
  if (cleaned.length > 15) {
    return 'Phone number is too long';
  }
  
  if (!RegExp(r'^[0-9]+$').hasMatch(cleaned)) {
    return 'Phone number must contain only digits';
  }
  
  return null;  // Valid
}
```

### 4. Debouncing Input (for API calls)

```dart
import 'dart:async';

class _SearchPageState extends State<SearchPage> {
  final searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    _debounce = Timer(const Duration(milliseconds: 500), () {
      // Perform search after user stops typing
      _performSearch(searchController.text);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    searchController.dispose();
    super.dispose();
  }
}
```

---

## Common Patterns Summary

### Pattern 1: Simple Form
- Single controller per field
- Basic validation
- Direct submission

### Pattern 2: Form with API Integration
- Controllers + GetX state management
- Loading states
- Error handling
- Success navigation

### Pattern 3: Form with Pre-filled Data
- Listener management
- Programmatic value setting
- Change tracking
- Modified state detection

### Pattern 4: Complex Form with Selections
- Multiple data sources
- Saved items selection
- Dynamic field population
- Mixed user/programmatic input

---

## Best Practices Checklist

- [ ] Declare controllers as final instance variables
- [ ] Add listeners in `initState()`
- [ ] Always dispose controllers in `dispose()`
- [ ] Use `GlobalKey<FormState>` for validation
- [ ] Remove listeners before programmatic value changes
- [ ] Add listeners back after programmatic changes
- [ ] Use `.trim()` when reading controller values
- [ ] Validate before form submission
- [ ] Show loading states during async operations
- [ ] Check `mounted` before navigation
- [ ] Use descriptive controller names
- [ ] Implement proper error handling
- [ ] Provide clear validation messages
- [ ] Use appropriate keyboard types
- [ ] Implement focus management for better UX

---

## Common Pitfalls

### 1. Memory Leaks
```dart
// ❌ BAD - Controllers not disposed
class _MyFormState extends State<MyForm> {
  final controller = TextEditingController();
  // dispose() not implemented - MEMORY LEAK!
}

// ✅ GOOD - Always dispose
@override
void dispose() {
  controller.dispose();
  super.dispose();
}
```

### 2. Listener Triggers on Programmatic Changes
```dart
// ❌ BAD - Listener triggers incorrectly
void populateForm(Data data) {
  controller.text = data.value;  // Triggers listener!
}

// ✅ GOOD - Remove listener temporarily
void populateForm(Data data) {
  controller.removeListener(_onChange);
  controller.text = data.value;
  controller.addListener(_onChange);
}
```

### 3. Not Checking Form Validation
```dart
// ❌ BAD - No validation check
void submit() {
  final value = controller.text;
  apiCall(value);
}

// ✅ GOOD - Validate first
void submit() {
  if (!_formKey.currentState!.validate()) {
    return;
  }
  final value = controller.text.trim();
  apiCall(value);
}
```

### 4. Navigation Without Mount Check
```dart
// ❌ BAD - May cause errors
void submit() async {
  await apiCall();
  Navigator.pop(context);  // Widget may be disposed!
}

// ✅ GOOD - Check mounted
void submit() async {
  await apiCall();
  if (mounted) {
    Navigator.pop(context);
  }
}
```

---

## Performance Considerations

### 1. Minimize Rebuilds
```dart
// Use Obx for selective rebuilds
Obx(() => Text('Count: ${controller.count.value}'))

// Separate stateful widgets for form fields
// instead of rebuilding entire form
```

### 2. Dispose Properly
```dart
// Always dispose in correct order
@override
void dispose() {
  // 1. Remove listeners
  controller.removeListener(_onChanged);
  // 2. Dispose controllers
  controller.dispose();
  // 3. Call super
  super.dispose();
}
```

### 3. Debounce Expensive Operations
```dart
// Don't call API on every keystroke
searchController.addListener(() {
  _debounce?.cancel();
  _debounce = Timer(Duration(milliseconds: 500), () {
    _search(searchController.text);
  });
});
```

---

## Testing Considerations

### Unit Testing Controllers
```dart
test('Controller updates value', () {
  final controller = TextEditingController();
  controller.text = 'test';
  expect(controller.text, 'test');
  controller.dispose();
});
```

### Widget Testing Forms
```dart
testWidgets('Form validation works', (tester) async {
  await tester.pumpWidget(MyForm());
  
  // Find text field
  final field = find.byType(TextFormField);
  
  // Enter invalid text
  await tester.enterText(field, '');
  await tester.pump();
  
  // Verify error message
  expect(find.text('Required'), findsOneWidget);
});
```

---

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  get: ^4.6.6           # For GetX utilities (optional)
```

---

## Related Patterns

- **Provider Pattern** - Alternative to GetX for state management
- **BLoC Pattern** - Stream-based state management
- **Riverpod** - Modern provider alternative
- **MobX** - Reactive state management

---

## References

- [Flutter TextEditingController Documentation](https://api.flutter.dev/flutter/widgets/TextEditingController-class.html)
- [Form Validation Guide](https://docs.flutter.dev/cookbook/forms/validation)
- [GetX Documentation](https://pub.dev/packages/get)

---

## Summary

The TextEditingController pattern in Flutter provides a robust way to manage form inputs with:

1. **Direct Value Access** - Read/write field values easily
2. **Change Listening** - React to user input
3. **Validation Support** - Built-in form validation
4. **Memory Management** - Proper disposal prevents leaks
5. **Flexibility** - Works with any state management solution

**Key Takeaway:** The critical pattern is temporarily removing listeners when setting values programmatically to distinguish between user input and code-driven changes.

---

## License
This pattern documentation is based on the Borewell Motor Automation project and can be freely reused in other Flutter projects.
