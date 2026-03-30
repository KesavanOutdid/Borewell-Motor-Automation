import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:permission_handler/permission_handler.dart';
import '../../../../../core/config/env.dart';
import '../../../../../core/services/token_service.dart';
import '../../../../../utils/ui_utils.dart';
import '../pages/map_picker_page.dart';
import '../pages/qr_scanner_page.dart';

class ConfigureDeviceController extends GetxController with WidgetsBindingObserver {
  final formKey = GlobalKey<FormState>();
  final imeiController = TextEditingController();
  final nicknameController = TextEditingController();
  final locationController = TextEditingController();
  final motorHpController = TextEditingController();
  
  String serialNumber = '';
  late TokenService tokenService;

  var isLoading = false.obs;
  var isGettingLocation = false.obs;
  var autovalidateMode = AutovalidateMode.disabled.obs;
  
  double? selectedLatitude;
  double? selectedLongitude;

  bool _shouldAutoFetchLocation = false;

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    final args = Get.arguments;
    if (args is Map<String, dynamic>) {
      serialNumber = (args['serial_number'] ?? args['serialNumber'] ?? '').toString();
    } else if (args is String) {
      serialNumber = args;
    }
    tokenService = Get.find<TokenService>();

    if (serialNumber.trim().isEmpty) {
      Future.delayed(Duration.zero, () {
        Get.snackbar(
          'Device Required',
          'Select a device from your list to configure',
          snackPosition: SnackPosition.BOTTOM,
          duration: const Duration(seconds: 3),
        );
      });
    }
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    imeiController.dispose();
    nicknameController.dispose();
    locationController.dispose();
    motorHpController.dispose();
    super.onClose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _shouldAutoFetchLocation) {
      _shouldAutoFetchLocation = false;
      _checkAndFetchLocation();
    }
  }

  Future<void> _checkAndFetchLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (serviceEnabled) {
      getCurrentLocation();
    }
  }

  Future<void> getCurrentLocation() async {
    print('📍 Getting current location...');
    isGettingLocation.value = true;

    try {
      print('📍 Checking location permission...');
      LocationPermission permission = await Geolocator.checkPermission();
      print('📍 Current permission: $permission');
      
      if (permission == LocationPermission.denied) {
        print('📍 Requesting location permission...');
        permission = await Geolocator.requestPermission();
        print('📍 Permission after request: $permission');
        
        if (permission == LocationPermission.denied) {
          print('❌ Location permission denied');
          isGettingLocation.value = false;
          
          Future.delayed(Duration.zero, () {
            Get.snackbar(
              'Permission Denied',
              'Location permission is required to get your address',
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.red[100],
              duration: const Duration(seconds: 4),
            );
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        print('❌ Location permission denied forever');
        isGettingLocation.value = false;
        _shouldAutoFetchLocation = true;
        
        Future.delayed(Duration.zero, () {
          Get.dialog(
            Builder(
              builder: (context) => Dialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.location_off,
                        size: 60,
                        color: Colors.red[400],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Location Permission Required',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Please enable location permission in app settings to use this feature',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        alignment: WrapAlignment.center,
                        children: [
                          OutlinedButton(
                            onPressed: () => Navigator.of(context).pop(),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              minimumSize: const Size(120, 48),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              Get.back();
                              openAppSettings();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green[600],
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              minimumSize: const Size(120, 48),
                              elevation: 0,
                            ),
                            child: const Text(
                              'Settings',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        });
        return;
      }

      print('📍 Getting current position (triggers native dialog if needed)...');
      // On Android, getCurrentPosition triggers the native Google Location Accuracy dialog
      // if location services are off or in battery saving mode.
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );
      print('✅ Position: ${position.latitude}, ${position.longitude}');

      print('📍 Getting address from coordinates...');
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      print('✅ Found ${placemarks.length} placemarks');

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        List<String> addressParts = [];
        
        if (place.name != null && place.name!.isNotEmpty) {
          addressParts.add(place.name!);
        }
        if (place.street != null && place.street!.isNotEmpty && place.street != place.name) {
          addressParts.add(place.street!);
        }
        if (place.subLocality != null && place.subLocality!.isNotEmpty) {
          addressParts.add(place.subLocality!);
        }
        if (place.locality != null && place.locality!.isNotEmpty) {
          addressParts.add(place.locality!);
        }
        if (place.subAdministrativeArea != null && place.subAdministrativeArea!.isNotEmpty) {
          addressParts.add(place.subAdministrativeArea!);
        }
        if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
          addressParts.add(place.administrativeArea!);
        }
        if (place.postalCode != null && place.postalCode!.isNotEmpty) {
          addressParts.add(place.postalCode!);
        }
        if (place.country != null && place.country!.isNotEmpty) {
          addressParts.add(place.country!);
        }

        String address = addressParts.join(', ');
        locationController.text = address.isNotEmpty ? address : 'Unknown Location';
        
        selectedLatitude = position.latitude;
        selectedLongitude = position.longitude;
        
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar(
            'Location Found',
            'Lat: ${position.latitude.toStringAsFixed(6)}\nLong: ${position.longitude.toStringAsFixed(6)}',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green[100],
            duration: const Duration(seconds: 3),
          );
        });
      } else {
        locationController.text = 'Lat: ${position.latitude.toStringAsFixed(6)}, Long: ${position.longitude.toStringAsFixed(6)}';
        
        selectedLatitude = position.latitude;
        selectedLongitude = position.longitude;
        
        Future.delayed(Duration.zero, () {
          Get.snackbar(
            'Location Found',
            'Address not available, showing coordinates',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.orange[100],
            duration: const Duration(seconds: 2),
          );
        });
      }
    } catch (e, stackTrace) {
      print('❌ Error getting location: $e');
      print('❌ Stack trace: $stackTrace');
      
      String errorMessage = 'Failed to get location';
      
      if (e.toString().contains('PERMISSION_DENIED')) {
        errorMessage = 'Location permission was denied';
      } else if (e.toString().contains('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (e.toString().contains('location service')) {
        errorMessage = 'Location services are disabled';
      } else {
        errorMessage = 'Error: ${e.toString()}';
      }
      
      Future.delayed(Duration.zero, () {
        Get.snackbar(
          'Location Error',
          errorMessage,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
          duration: const Duration(seconds: 5),
        );
      });
    } finally {
      isGettingLocation.value = false;
      print('📍 Location fetching completed');
    }
  }

  Future<void> pickLocationOnMap() async {
    print('🗺️ Opening map picker...');
    
    final dynamic result = await Get.to(() => const MapPickerView());
    
    if (result != null) {
      LatLng? location;
      String? address;

      if (result is Map) {
        location = result['location'];
        address = result['address'];
      } else if (result is LatLng) {
        location = result;
      }

      if (location != null) {
        print('✅ Location picked: ${location.latitude}, ${location.longitude}');
        selectedLatitude = location.latitude;
        selectedLongitude = location.longitude;
        
        if (address != null && address.isNotEmpty) {
          locationController.text = address;
        } else {
          locationController.text = 'Lat: ${location.latitude.toStringAsFixed(3)}, Long: ${location.longitude.toStringAsFixed(3)}';
        }

        Future.delayed(Duration.zero, () {
          Get.snackbar(
            'Location Selected',
            'Lat: ${location!.latitude.toStringAsFixed(3)}\nLong: ${location.longitude.toStringAsFixed(3)}',
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green[100],
            duration: const Duration(seconds: 2),
          );
        });
      }
    } else {
      print('❌ Map picker cancelled');
    }
  }

  Future<void> scanQRCode() async {
    print('📷 Opening QR scanner...');
    
    final cameraStatus = await Permission.camera.status;
    
    if (cameraStatus.isDenied) {
      final result = await Permission.camera.request();
      if (result.isDenied) {
        Get.snackbar(
          'Permission Denied',
          'Camera permission is required to scan QR codes',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
          duration: const Duration(seconds: 3),
        );
        return;
      }
    } else if (cameraStatus.isPermanentlyDenied) {
      Get.dialog(
        Builder(
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.camera_alt_outlined,
                    size: 60,
                    color: Colors.orange[400],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Camera Permission Required',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Please enable camera permission in app settings to scan QR codes',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black54,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    alignment: WrapAlignment.center,
                    children: [
                      OutlinedButton(
                        onPressed: () => Get.back(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size(120, 48),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          openAppSettings();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[600],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          minimumSize: const Size(120, 48),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Settings',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      return;
    }
    
    final String? result = await Get.to(() => const QRScannerView());
    
    if (result != null && result.isNotEmpty) {
      print('✅ QR Code scanned: $result');
      
      if (RegExp(r'^[0-9]{15}$').hasMatch(result)) {
        imeiController.text = result;
        Get.snackbar(
          'QR Code Scanned',
          'IMEI: $result',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green[100],
          duration: const Duration(seconds: 2),
        );
      } else {
        Get.snackbar(
          'Invalid QR Code',
          'The scanned code is not a valid 15-digit IMEI number',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.orange[100],
          duration: const Duration(seconds: 3),
        );
      }
    } else {
      print('❌ QR scanner cancelled');
    }
  }

  bool _validateInputs() {
    if (serialNumber.trim().isEmpty) {
      Get.snackbar(
        'Validation Error',
        'Unable to determine device. Please open configuration from the device card.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
      return false;
    }

    if (nicknameController.text.trim().isEmpty) {
      Get.snackbar(
        'Validation Error',
        'Please enter a device nickname',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
      return false;
    }

    return true;
  }

  Future<void> configureDevice() async {
    if (!_validateInputs()) return;

    isLoading.value = true;

    try {
      final url = Uri.parse(AppConfig.baseUrl + AppConfig.configureIMEIEndpoint);
      final token = tokenService.getToken();
      final userEmail = tokenService.getUserEmail();

      final body = {
        "serial_number": serialNumber,
        "device_nickname": nicknameController.text.trim(),
        "user_email": userEmail,
        "timestamp": DateTime.now().toIso8601String(),
        "latitude": selectedLatitude?.toString() ?? "0",
        "longitude": selectedLongitude?.toString() ?? "0",
        "motor_hp": motorHpController.text.trim(),
      };

      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode(body),
      );

      isLoading.value = false;

      if (response.statusCode == 200) {
        Get.dialog(
          Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.green[100],
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle,
                      size: 40,
                      color: Colors.green[600],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Device Configured Successfully!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Serial: $serialNumber',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Get.back();
                      Get.offAllNamed('/home');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green[600],
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 45),
                    ),
                    child: const Text('Back to Devices'),
                  ),
                ],
              ),
            ),
          ),
          barrierDismissible: false,
        );
      } else if (response.statusCode == 401) {
        Get.snackbar(
          'Error',
          'Session expired. Please login again',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
        );
        Get.offAllNamed('/login');
      } else if (response.statusCode == 403) {
        _handleDeactivated();
      } else if (response.statusCode == 404) {
        Get.snackbar(
          'Error',
          'Device not found or not assigned to you',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
        );
      } else {
        final errorData = jsonDecode(response.body);
        final errorMessage = errorData['message'] ?? 'Failed to configure device';
        
        if (errorMessage.contains("imei_number is there")) {
          Get.dialog(
            Builder(
              builder: (context) => Dialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.red[100],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.warning_amber_rounded,
                          size: 40,
                          color: Colors.red[600],
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'IMEI Already Registered',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'This IMEI number (${imeiController.text}) is already assigned to another device. Please provide a unique IMEI number.',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[600],
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 45),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('OK'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        } else {
          Get.snackbar(
            'Error',
            errorMessage,
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.red[100],
          );
        }
      }
    } catch (e) {
      isLoading.value = false;
      Get.snackbar(
        'Error',
        'Connection failed: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
    }
  }

  void _handleDeactivated() {
    UIUtils.handleAccountDeactivated();
  }
}
