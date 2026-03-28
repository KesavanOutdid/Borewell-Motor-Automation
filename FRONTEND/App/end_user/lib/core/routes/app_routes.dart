import 'package:get/get.dart';
import '../splash_screen.dart';
import '../../feature/end_user_app/auth/presentation/pages/login_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/login_binding.dart';
import '../../feature/end_user_app/auth/presentation/pages/signup_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/signup_binding.dart';
import '../../feature/end_user_app/auth/presentation/pages/forgot_password_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/forgot_password_binding.dart';
import '../../feature/end_user_app/auth/presentation/pages/otp_verification_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/reset_password_page.dart';
import '../../feature/end_user_app/dashboard/presentation/pages/dashboard_page.dart';
import '../../feature/end_user_app/dashboard/presentation/pages/dashboard_binding.dart';
import '../../feature/end_user_app/auth/presentation/pages/language_selection_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_binding.dart';
import '../../feature/end_user_app/device/presentation/pages/device_details_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_history_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_schedule_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_analytics_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_sharing_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_sharing_binding.dart';
import '../../feature/end_user_app/device/presentation/pages/add_device_page.dart' as config_device;
import '../../feature/end_user_app/profile/presentation/pages/profile_page.dart';
import '../../feature/end_user_app/profile/presentation/pages/profile_binding.dart';
import '../../feature/end_user_app/profile/presentation/pages/edit_profile_page.dart';
import '../../feature/end_user_app/settings/presentation/pages/settings_page.dart';
import '../../feature/end_user_app/settings/presentation/pages/settings_binding.dart';
import '../../feature/end_user_app/contact/presentation/pages/contact_page.dart';
import '../../feature/end_user_app/profile/presentation/pages/privacy_policy_page.dart';
import '../../feature/end_user_app/notifications/presentation/pages/notification_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/checkout_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/orders_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/order_details_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/addresses_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/add_edit_address_page.dart';
import '../../feature/end_user_app/shop/presentation/pages/vouchers_page.dart';

class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const signup = '/signup';
  static const languageSelection = '/language-selection';
  static const home = '/home';
  static const device = '/device';
  static const deviceDetails = '/device/details';
  static const deviceHistory = '/device/history';
  static const deviceSchedule = '/device/schedule';
  static const deviceAnalytics = '/device/analytics';
  static const deviceSharing = '/device/sharing';
  static const configureDevice = '/device/configure';
  static const profile = '/profile';
  static const editProfile = '/editProfile';
  static const settings = '/settings';
  static const contact = '/contact';
  static const privacyPolicy = '/privacyPolicy';
  static const notifications = '/notifications';
  static const checkout = '/checkout';
  static const orders = '/orders';
  static const orderDetails = '/order-details';
  static const addresses = '/addresses';
  static const addAddress = '/add-address';
  static const vouchers = '/vouchers';
  static const forgotPassword = '/forgot-password';
  static const otpVerification = '/otp-verification';
  static const resetPassword = '/reset-password';

  static final routes = [
    GetPage(
      name: splash,
      page: () => const SplashView(),
    ),
    GetPage(
      name: login,
      page: () => LoginView(),
      binding: LoginBinding(),
    ),
    GetPage(
      name: signup,
      page: () => SignupView(),
      binding: SignupBinding(),
    ),
    GetPage(
      name: forgotPassword,
      page: () => ForgotPasswordView(),
      binding: ForgotPasswordBinding(),
    ),
    GetPage(
      name: otpVerification,
      page: () => OtpVerificationView(),
      binding: ForgotPasswordBinding(),
    ),
    GetPage(
      name: resetPassword,
      page: () => ResetPasswordView(),
      binding: ForgotPasswordBinding(),
    ),
    GetPage(
      name: home,
      page: () => const DashboardView(),
      binding: DashboardBinding(),
    ),
    GetPage(
      name: languageSelection,
      page: () => LanguageSelectionPage(),
    ),
    GetPage(
      name: device,
      page: () => DeviceView(),
      binding: DeviceBinding(),
    ),
    GetPage(
      name: deviceDetails,
      page: () => const DeviceDetailsView(),
      binding: DeviceDetailsBinding(),
    ),
    GetPage(
      name: deviceHistory,
      page: () => const DeviceHistoryView(),
    ),
    GetPage(
      name: deviceSchedule,
      page: () => const DeviceSchedulePage(),
    ),
    GetPage(
      name: deviceAnalytics,
      page: () => const DeviceAnalyticsView(),
    ),
    GetPage(
      name: deviceSharing,
      page: () => const DeviceSharingView(),
      binding: DeviceSharingBinding(),
    ),
    GetPage(
      name: configureDevice,
      page: () => config_device.ConfigureDeviceView(),
    ),
    GetPage(
      name: profile,
      page: () => const ProfileView(),
      binding: ProfileBinding(),
    ),
    GetPage(
      name: editProfile,
      page: () => const EditProfilePage(),
      binding: ProfileBinding(),
    ),
    GetPage(
      name: settings,
      page: () => const SettingsView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: contact,
      page: () => const ContactView(),
    ),
    GetPage(
      name: privacyPolicy,
      page: () => const PrivacyPolicyView(),
    ),
    GetPage(
      name: notifications,
      page: () => const NotificationPage(),
    ),
    GetPage(
      name: checkout,
      page: () => const CheckoutPage(),
    ),
    GetPage(
      name: orders,
      page: () => const OrdersPage(),
    ),
    GetPage(
      name: orderDetails,
      page: () => const OrderDetailsPage(),
    ),
    GetPage(
      name: addresses,
      page: () => const AddressesPage(),
    ),
    GetPage(
      name: addAddress,
      page: () => const AddEditAddressPage(),
    ),
    GetPage(
      name: vouchers,
      page: () => const VouchersPage(),
    ),
  ];
}
