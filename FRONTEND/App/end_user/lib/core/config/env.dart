class AppConfig {
  static const String baseUrl = "http://192.168.0.7:3030";
  static const String loginEndpoint = "/app/login";
  static const String signupEndpoint = "/app/signup";
  static const String deviceEndpoint = "/api/devices";
  static const String profileEndpoint = "/app/profile";
  static const String updateProfileEndpoint = "/app/updatedProfile";
  static const String changePasswordEndpoint = "/app/changePassword";
  static const String userAssignedDevicesEndpoint = "/app/userAssignDevices";
  static const String configureIMEIEndpoint = "/app/configIMEInumber";
  static const String userDeviceDetailsEndpoint = "/app/userDeviceDetails";
  static const String userDeviceHistoryEndpoint = "/app/userDeviceHistory";
  static const String userDeviceHistoryDetailsEndpoint =
      "/app/userDeviceHistoryDetails";
  static const String startStopDeviceEndpoint = "/app/startStopDevice";
  static const String uploadProfileImageEndpoint = "/app/uploadProfileImage";
  static const String deleteProfileImageEndpoint = "/app/deleteProfileImage";
  static const String updateDeviceNicknameEndpoint = "/app/updateDeviceNickname";
  static const String updateFcmTokenEndpoint = "/app/updateFcmToken";
  static const String removeFcmTokenEndpoint = "/app/removeFcmToken";
  static const String analyticsEndpoint = "/app/analytics";
  static const String deviceAssignToUserEndpoint = "/admin/deviceAssignTouser";
  static const String getAllVouchersEndpoint = "/app/getAllVouchers";
  static const String validateVoucherEndpoint = "/app/validateVoucher";
  static const String sendOtpEndpoint = "/app/forgotPasswordRequest";
  static const String verifyOtpEndpoint = "/app/verifyOtp";
  static const String verifyOtpAndResetPasswordEndpoint = "/app/resetPassword";
  static const String socketIOUrl = "http://192.168.0.7:3030";
}


