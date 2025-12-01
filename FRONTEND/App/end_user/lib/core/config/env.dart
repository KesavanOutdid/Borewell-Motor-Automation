class AppConfig {
  static const String baseUrl = "http://192.168.0.25:3000";
  static const String loginEndpoint = "/app/login";
  static const String signupEndpoint = "/admin/create";
  static const String deviceEndpoint = "/api/devices";
  static const String profileEndpoint = "/app/profile";
  static const String updateProfileEndpoint = "/app/updatedProfile";
  static const String changePasswordEndpoint = "/app/changePassword";
  static const String userAssignedDevicesEndpoint = "/app/userAssignDevices";
  static const String configureIMEIEndpoint = "/app/configIMEInumber";
  static const String userDeviceDetailsEndpoint = "/app/userDeviceDetails";
  static const String userDeviceHistoryEndpoint = "/app/userDeviceHistory";
  static const String userDeviceHistoryDetailsEndpoint = "/app/userDeviceHistoryDetails";
  static const String startStopDeviceEndpoint = "/app/startStopDevice";
  static const String analyticsEndpoint = "/app/analytics";
  static const String websocketHost = "192.168.0.25";
  static const int websocketPort = 8081;
  static const String websocketUrl = "ws://$websocketHost:$websocketPort";
}
