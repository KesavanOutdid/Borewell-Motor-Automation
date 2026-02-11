# Build Configuration Guide - Environment & API Settings

This guide explains how to configure API endpoints and sensitive credentials when building the Flutter application.

## Overview

The application now uses environment-based configuration through Dart's `String.fromEnvironment` to externalize:
- **API_BASE_URL**: The backend API endpoint
- **RAZORPAY_KEY_ID**: Razorpay payment gateway key
- **SOCKET_IO_URL**: WebSocket server URL

All configuration sources are defined in [`lib/core/config/env.dart`](lib/core/config/env.dart).

## Configuration Values

### AppConfig.baseUrl
- **Environment Variable**: `API_BASE_URL`
- **Default**: `https://localhost:3030`
- **Usage**: LocationsController, AddressController, OrdersController, CheckoutController
- **Note**: Uses HTTPS by default for production safety. For local development with HTTP, explicitly pass the config.

### AppConfig.razorpayKeyId  
- **Environment Variable**: `RAZORPAY_KEY_ID`
- **Default**: Empty string `''`
- **Usage**: CheckoutController (payment gateway initialization)
- **Note**: Must be configured before checkout functionality works in production

### AppConfig.socketIOUrl
- **Environment Variable**: `SOCKET_IO_URL`
- **Default**: `https://localhost:3030`
- **Usage**: WebSocket real-time updates
- **Note**: Should match your Socket.IO server URL

## Running the App with Configuration

### Local Development (Localhost with HTTP)

For local development with your backend running on `http://localhost:3030`:

**MacOS/Linux:**
```bash
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3030 \
  --dart-define=SOCKET_IO_URL=http://localhost:3030
```

**Windows (PowerShell):**
```powershell
flutter run `
  --dart-define=API_BASE_URL=http://localhost:3030 `
  --dart-define=SOCKET_IO_URL=http://localhost:3030
```

**Windows (Command Prompt):**
```cmd
flutter run ^
  --dart-define=API_BASE_URL=http://localhost:3030 ^
  --dart-define=SOCKET_IO_URL=http://localhost:3030
```

### Local Network Development (IP-based)

For development on a network (e.g., mobile testing on different device):

```bash
flutter run \
  --dart-define=API_BASE_URL=http://192.168.1.100:3030 \
  --dart-define=SOCKET_IO_URL=http://192.168.1.100:3030
```

### Production Build

For production with HTTPS:

```bash
flutter build apk/ios \
  --dart-define=API_BASE_URL=https://api.yourdomain.com \
  --dart-define=RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx \
  --dart-define=SOCKET_IO_URL=https://api.yourdomain.com
```

### Using Build Flavors (Recommended)

Create Flutter build flavors for better build management:

**lib/main_dev.dart** - Development entry point
```dart
import 'main.dart';

void main() {
  // Dev config
  runApp(const MyApp());
}
```

**lib/main_prod.dart** - Production entry point  
```dart
import 'main.dart';

void main() {
  // Prod config
  runApp(const MyApp());
}
```

Then run with flavor-specific commands:
```bash
# Development
flutter run -t lib/main_dev.dart \
  --dart-define=API_BASE_URL=http://localhost:3030

# Production
flutter run -t lib/main_prod.dart \
  --dart-define=API_BASE_URL=https://api.yourdomain.com \
  --dart-define=RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

## Using .env Files (Optional - flutter_dotenv Package)

If you prefer .env files, install flutter_dotenv:

```bash
flutter pub add flutter_dotenv
```

Create `.env` file:
```
API_BASE_URL=http://localhost:3030
RAZORPAY_KEY_ID=your_key_here
SOCKET_IO_URL=http://localhost:3030
```

Update `lib/core/config/env.dart`:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://localhost:3030';
  static String get razorpayKeyId => dotenv.env['RAZORPAY_KEY_ID'] ?? '';
  // ...
}
```

Load in main.dart before running app:
```dart
void main() async {
  await dotenv.load(fileName: ".env");
  runApp(const MyApp());
}
```

## Affected Files

The following files have been updated to use the centralized AppConfig:

1. **[lib/core/config/env.dart](lib/core/config/env.dart)** - Configuration definitions
2. **[lib/feature/end_user_app/shop/presentation/controllers/address_controller.dart](lib/feature/end_user_app/shop/presentation/controllers/address_controller.dart)** - Uses AppConfig.baseUrl
3. **[lib/feature/end_user_app/shop/presentation/controllers/checkout_controller.dart](lib/feature/end_user_app/shop/presentation/controllers/checkout_controller.dart)** - Uses AppConfig.baseUrl and AppConfig.razorpayKeyId
4. **[lib/feature/end_user_app/shop/presentation/controllers/orders_controller.dart](lib/feature/end_user_app/shop/presentation/controllers/orders_controller.dart)** - Uses AppConfig.baseUrl

## Security Best Practices

✅ **DO:**
- Use HTTPS for production endpoints
- Store sensitive keys (like RAZORPAY_KEY_ID) in environment variables, not in code
- Use different credentials for dev/staging/production
- Never commit .env files with real credentials to version control
- Pass credentials via CI/CD pipeline environment variables

❌ **DON'T:**
- Hardcode API URLs or keys in controllers
- Commit .env files with real credentials
- Use HTTP in production
- Share API keys via chat or email

## Troubleshooting

**API calls returning 400/403 errors?**
- Verify API_BASE_URL is correct and accessible
- Check that trailing slashes are not present in the URL

**Razorpay not initializing?**
- Ensure RAZORPAY_KEY_ID is set (not empty) for production
- Verify you're using the correct key for test vs. live environment

**Changes not taking effect?**
- Run `flutter clean` before building with new dart-define values
- Ensure you're passing --dart-define in the correct format for your OS

## References

- [Flutter Environment Variables Documentation](https://flutter.dev/docs/guide/build-flavors)
- [Dart String.fromEnvironment Documentation](https://api.dart.dev/stable/dart-core/String/String.fromEnvironment.html)
- [flutter_dotenv Package](https://pub.dev/packages/flutter_dotenv)
