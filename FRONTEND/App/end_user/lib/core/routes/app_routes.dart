import 'package:get/get.dart';
import '../splash_screen.dart';
import '../../feature/end_user_app/auth/presentation/pages/login_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/login_binding.dart';
import '../../feature/end_user_app/auth/presentation/pages/signup_page.dart';
import '../../feature/end_user_app/auth/presentation/pages/signup_binding.dart';
import '../../feature/end_user_app/home/presentation/pages/home_page.dart';
import '../../feature/end_user_app/home/presentation/pages/home_binding.dart';
import '../../feature/end_user_app/device/presentation/pages/device_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_binding.dart';
import '../../feature/end_user_app/device/presentation/pages/device_details_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_history_page.dart';
import '../../feature/end_user_app/device/presentation/pages/device_analytics_page.dart';
import '../../feature/end_user_app/device/presentation/pages/add_device_page.dart' as config_device;
import '../../feature/end_user_app/profile/presentation/pages/profile_page.dart';
import '../../feature/end_user_app/profile/presentation/pages/profile_binding.dart';
import '../../feature/end_user_app/profile/presentation/pages/edit_profile_page.dart';
import '../../feature/end_user_app/dashboard/presentation/pages/dashboard_page.dart';
import '../../feature/end_user_app/dashboard/presentation/pages/dashboard_binding.dart';
import '../../feature/end_user_app/settings/presentation/pages/settings_page.dart';
import '../../feature/end_user_app/settings/presentation/pages/settings_binding.dart';
import '../../feature/end_user_app/contact/presentation/pages/contact_page.dart';
import '../../feature/end_user_app/profile/presentation/pages/privacy_policy_page.dart';
import '../../feature/end_user_app/notifications/presentation/pages/notification_page.dart';

class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const signup = '/signup';
  static const home = '/home';
  static const device = '/device';
  static const deviceDetails = '/device/details';
  static const deviceHistory = '/device/history';
  static const deviceAnalytics = '/device/analytics';
  static const configureDevice = '/device/configure';
  static const profile = '/profile';
  static const editProfile = '/editProfile';
  static const settings = '/settings';
  static const contact = '/contact';
  static const privacyPolicy = '/privacyPolicy';
  static const notifications = '/notifications';

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
      name: home,
      page: () => const DashboardView(),
      binding: DashboardBinding(),
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
      name: deviceAnalytics,
      page: () => const DeviceAnalyticsView(),
    ),
    GetPage(
      name: configureDevice,
      page: () => const config_device.ConfigureDeviceView(),
    ),
    GetPage(
      name: profile,
      page: () => const ProfileView(),
      binding: ProfileBinding(),
    ),
    GetPage(
      name: editProfile,
      page: () => const EditProfileView(),
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
  ];
}
