import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

class TokenService extends GetxService {
  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userNameKey = 'user_name';
  static const String _userEmailKey = 'user_email';
  static const String _lastEmailKey = 'last_email';

  Future<TokenService> init() async {
    return this;
  }

  Future<void> saveToken(String token, int userId, String userName, {String? userEmail}) async {
    await GetStorage().write(_tokenKey, token);
    await GetStorage().write(_userIdKey, userId);
    await GetStorage().write(_userNameKey, userName);
    if (userEmail != null) {
      await GetStorage().write(_userEmailKey, userEmail);
    }
  }

  String? getToken() {
    return GetStorage().read<String>(_tokenKey);
  }

  int? getUserId() {
    return GetStorage().read<int>(_userIdKey);
  }

  String? getUserName() {
    return GetStorage().read<String>(_userNameKey);
  }

  String? getUserEmail() {
    return GetStorage().read<String>(_userEmailKey);
  }

  String? getLastEmail() {
    return GetStorage().read<String>(_lastEmailKey);
  }

  Future<void> saveLastEmail(String email) async {
    await GetStorage().write(_lastEmailKey, email);
  }

  Future<void> clearToken() async {
    await GetStorage().remove(_tokenKey);
    await GetStorage().remove(_userIdKey);
    await GetStorage().remove(_userNameKey);
    await GetStorage().remove(_userEmailKey);
  }

  bool isTokenExists() {
    return GetStorage().read<String>(_tokenKey) != null;
  }
}
