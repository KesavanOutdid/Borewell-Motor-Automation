# Address Management & Pincode Auto-Fill Implementation Guide

## Overview
This document describes the technology stack and implementation approach for address management with automatic location fetching using pincode. This can be reused across projects.

---

## Technology Stack

### Backend (Node.js/Express)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: express-validator
- **Authentication**: JWT Bearer Token
- **API Pattern**: RESTful API with POST requests

### Frontend (Flutter)
- **State Management**: GetX
- **HTTP Client**: http package
- **Architecture**: MVC pattern with controllers and models
- **Reactive Programming**: Observable streams (.obs)

---

## Core Features

1. **CRUD Operations** - Create, Read, Update, Delete addresses
2. **Default Address** - Set one address as default per user
3. **Soft Delete** - Addresses are marked inactive instead of permanent deletion
4. **Pincode Auto-Fill** - Automatically fetch city and state from pincode
5. **User-Scoped** - Addresses are linked to specific users
6. **JWT Authentication** - Secure API endpoints

---

## Backend Implementation

### 1. Database Schema (Mongoose)

```javascript
const AddressSchema = new mongoose.Schema({
    address_id: { type: Number, unique: true },
    user_id: { type: Number, required: true, index: true },
    full_name: { type: String, required: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ },
    country: { type: String, default: 'India' },
    is_default: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null }
});
```

**Key Features:**
- Regex validation for phone (10 digits) and pincode (6 digits)
- Auto-increment address_id
- Soft delete with `status` field
- Audit trail with createdBy/updatedBy

### 2. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/address/createAddress` | POST | Create new address |
| `/address/getAddresses` | POST | Get all user addresses |
| `/address/getAddressById` | POST | Get specific address |
| `/address/updateAddress` | POST | Update address |
| `/address/deleteAddress` | POST | Soft delete address |
| `/address/setDefaultAddress` | POST | Set default address |

### 3. Validation Rules

```javascript
[
    body('user_id').isInt(),
    body('full_name').notEmpty(),
    body('phone').matches(/^[0-9]{10}$/),
    body('email').isEmail(),
    body('street').notEmpty(),
    body('city').notEmpty(),
    body('state').notEmpty(),
    body('pincode').matches(/^[0-9]{6}$/),
    body('country').optional().isString(),
    body('is_default').optional().isBoolean()
]
```

### 4. Controller Pattern

```javascript
exports.createAddress = async (req, res, next) => {
    try {
        // 1. Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        // 2. Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // 3. Auto-increment address_id
        const lastAddress = await Address.findOne().sort({ address_id: -1 }).lean();
        const newAddressId = lastAddress ? lastAddress.address_id + 1 : 1;

        // 4. Create and save address
        const address = new Address({ /* fields */ });
        await address.save();

        // 5. Return response
        res.status(201).json({ success: true, data: address });
    } catch (err) {
        next(err);
    }
};
```

### 5. Default Address Logic

```javascript
// Remove default from all other addresses
await Address.updateMany(
    { user_id, address_id: { $ne: address_id } },
    { is_default: false }
);

// Set current address as default
address.is_default = true;
await address.save();
```

---

## Frontend Implementation (Flutter)

### 1. Data Model

```dart
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

  // fromJson, toJson, copyWith methods
}
```

### 2. GetX Controller

```dart
class AddressController extends GetxController {
  var addresses = <AddressModel>[].obs;
  var isLoading = false.obs;
  var selectedAddress = Rxn<AddressModel>();
  
  final String baseUrl = 'http://your-api-url:3030';
  late TokenService tokenService;

  Future<void> fetchAddresses() async {
    final userId = tokenService.getUserId();
    final token = tokenService.getToken();
    
    isLoading.value = true;
    final response = await http.post(
      Uri.parse('$baseUrl/app/address/getAddresses'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'user_id': userId}),
    );

    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      addresses.value = responseData['data']['addresses']
          .map((json) => AddressModel.fromJson(json))
          .toList();
    }
    isLoading.value = false;
  }
}
```

### 3. Pincode Auto-Fill Feature

**API Used**: [Postal Pincode API](https://api.postalpincode.in/)

```dart
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
        );
      }
    }
  } catch (e) {
    // Silent fail - user can still enter manually
  } finally {
    setState(() => isLoadingPincode = false);
  }
}
```

**API Response Format:**
```json
[
  {
    "Status": "Success",
    "PostOffice": [
      {
        "Name": "Post Office Name",
        "District": "City/District Name",
        "State": "State Name",
        "Country": "India",
        "Pincode": "516005"
      }
    ]
  }
]
```

### 4. UI Implementation

```dart
_buildTextField(
  controller: pincodeController,
  label: 'Pincode',
  icon: Icons.pin_drop,
  keyboardType: TextInputType.number,
  onChanged: (value) {
    if (value.length == 6) {
      _fetchLocationByPincode(value);  // Auto-fetch on 6 digits
    }
  },
  validator: (value) {
    if (value == null || value.isEmpty) return 'Required';
    if (value.length != 6) return 'Invalid';
    return null;
  },
)
```

---

## Key Implementation Patterns

### 1. Auto-Increment Pattern (MongoDB)

```javascript
const lastAddress = await Address.findOne().sort({ address_id: -1 }).lean();
const newAddressId = lastAddress ? lastAddress.address_id + 1 : 1;
```

### 2. Soft Delete Pattern

```javascript
// Don't delete, just mark inactive
address.status = false;
address.updatedAt = new Date();
await address.save();

// Query only active addresses
Address.find({ user_id, status: true })
```

### 3. Default Address Pattern

- Only one address can be default per user
- When setting a new default, remove default flag from others
- Use atomic operations for consistency

### 4. Reactive State Management (GetX)

```dart
// Observable list
var addresses = <AddressModel>[].obs;

// Observable loading state
var isLoading = false.obs;

// Nullable observable for selected address
var selectedAddress = Rxn<AddressModel>();

// UI updates automatically when values change
Obx(() => Text('Count: ${addresses.length}'))
```

### 5. JWT Authentication Pattern

**Backend Middleware:**
```javascript
const authMiddleware = require('../middlewares/authMiddleware');
router.post('/createAddress', authMiddleware(), addressCtrl.createAddress);
```

**Frontend Headers:**
```dart
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $token',
}
```

---

## Validation Rules

### Phone Number
- **Format**: 10 digits
- **Regex**: `/^[0-9]{10}$/`
- **Example**: 9555665565

### Pincode (India)
- **Format**: 6 digits
- **Regex**: `/^[0-9]{6}$/`
- **Example**: 516005

### Email
- **Format**: Standard email
- **Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Example**: user@example.com

---

## Error Handling

### Backend
```javascript
try {
    // Business logic
} catch (err) {
    console.error("Error:", err);
    next(err);  // Pass to error middleware
}
```

### Frontend
```dart
try {
  final response = await http.post(...);
  // Handle response
} catch (e) {
  logger.e('Exception: $e');
  Get.snackbar('Error', 'Failed to perform action',
    snackPosition: SnackPosition.BOTTOM,
    backgroundColor: Colors.red,
    colorText: Colors.white,
  );
}
```

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "address_id": 1,
    "user_id": 15,
    "full_name": "John Doe",
    "phone": "9555665565",
    "email": "john@example.com",
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India",
    "is_default": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "phone",
      "message": "phone must be 10 digits"
    }
  ]
}
```

---

## Dependencies

### Backend (package.json)
```json
{
  "express": "^4.x",
  "mongoose": "^7.x",
  "express-validator": "^7.x",
  "jsonwebtoken": "^9.x"
}
```

### Frontend (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  get: ^4.6.6           # State management
  http: ^1.1.0          # API calls
  logger: ^2.0.2        # Logging
```

---

## Security Considerations

1. **JWT Authentication** - All endpoints protected
2. **User Verification** - Verify user exists before operations
3. **User-Scoped Queries** - Users can only access their own addresses
4. **Input Validation** - Server-side validation with express-validator
5. **Regex Validation** - Phone and pincode format enforcement
6. **Soft Delete** - Preserve data integrity and audit trail

---

## Reusability Checklist

When implementing in a new project:

- [ ] Update base URL in frontend controller
- [ ] Configure MongoDB connection
- [ ] Set up JWT authentication middleware
- [ ] Add Address model to database
- [ ] Create API routes with validation
- [ ] Implement controller methods
- [ ] Create Flutter model class
- [ ] Implement GetX controller
- [ ] Design UI forms with validation
- [ ] Add pincode auto-fill feature
- [ ] Test all CRUD operations
- [ ] Test default address logic
- [ ] Test soft delete functionality

---

## Alternative APIs for Pincode (International)

If you need to support countries beyond India:

1. **Google Maps Geocoding API** - Global coverage, requires API key
2. **OpenStreetMap Nominatim** - Free, open-source, global
3. **PostcodeAPI.com** - Multiple countries, freemium
4. **Zippopotam.us** - Free, supports multiple countries

**Example for USA:**
```dart
// Using Zippopotam.us
final response = await http.get(
  Uri.parse('http://api.zippopotam.us/us/$zipcode'),
);
```

---

## Best Practices

1. **Logging** - Use logger for debugging (Flutter) and console.error (Node.js)
2. **Loading States** - Show loading indicators during API calls
3. **User Feedback** - Display success/error messages
4. **Offline Handling** - Gracefully handle network errors
5. **Silent Failures** - Pincode auto-fill should fail silently
6. **Form Validation** - Both client-side and server-side
7. **Audit Trail** - Track who created/updated records
8. **Indexing** - Add database index on user_id for performance

---

## Performance Optimization

1. **Database Indexing**
```javascript
AddressSchema.index({ user_id: 1 });
AddressSchema.index({ address_id: 1 }, { unique: true });
```

2. **Lazy Loading** - Fetch addresses only when needed

3. **Debouncing** - For search/filter features (if added)

4. **Caching** - Cache token and user info in frontend

5. **Pagination** - For users with many addresses (future enhancement)

---

## Testing Considerations

### Backend Tests
- Unit tests for controller methods
- Integration tests for API endpoints
- Validation tests for input rules
- Authentication tests

### Frontend Tests
- Widget tests for UI components
- Integration tests for API calls
- State management tests

---

## License
This implementation pattern is based on the Borewell Motor Automation project and can be freely reused in other projects.
