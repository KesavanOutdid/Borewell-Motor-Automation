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
import '../pages/map_picker_page.dart';
import '../pages/qr_scanner_page.dart';

class ConfigureDeviceController extends GetxController {
  final imeiController = TextEditingController();
  final locationController = TextEditingController();
  final motorHpController = TextEditingController();
  
  String serialNumber = '';
  late TokenService tokenService;

  var isLoading = false.obs;
  var isGettingLocation = false.obs;
  
  double? selectedLatitude;
  double? selectedLongitude;

  @override
  void onInit() {
    super.onInit();
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
    imeiController.dispose();
    locationController.dispose();
    motorHpController.dispose();
    super.onClose();
  }

  Future<void> getCurrentLocation() async {
    print('📍 Getting current location...');
    isGettingLocation.value = true;

    try {
      print('📍 Checking if location service is enabled...');
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      print('📍 Location service enabled: $serviceEnabled');
      
      if (!serviceEnabled) {
        print('❌ Location services are disabled');
        isGettingLocation.value = false;
        
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
                        color: Colors.orange[400],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Location Services Disabled',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Please enable GPS/Location in your device settings to use this feature',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                Geolocator.openLocationSettings();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green[600],
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Settings'),
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
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                openAppSettings();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green[600],
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Settings'),
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

      print('📍 Getting current position...');
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
    
    LatLng? result = await Get.to(() => const MapPickerView());
    
    if (result != null) {
      print('✅ Location picked: ${result.latitude}, ${result.longitude}');
      
      selectedLatitude = result.latitude;
      selectedLongitude = result.longitude;
      
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          result.latitude,
          result.longitude,
        );
        
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
          if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
            addressParts.add(place.administrativeArea!);
          }
          if (place.postalCode != null && place.postalCode!.isNotEmpty) {
            addressParts.add(place.postalCode!);
          }
          
          String address = addressParts.join(', ');
          locationController.text = address.isNotEmpty ? address : 'Lat: ${result.latitude.toStringAsFixed(6)}, Long: ${result.longitude.toStringAsFixed(6)}';
        } else {
          locationController.text = 'Lat: ${result.latitude.toStringAsFixed(6)}, Long: ${result.longitude.toStringAsFixed(6)}';
        }
      } catch (e) {
        print('❌ Error geocoding: $e');
        locationController.text = 'Lat: ${result.latitude.toStringAsFixed(6)}, Long: ${result.longitude.toStringAsFixed(6)}';
      }
      
      Future.delayed(Duration.zero, () {
        Get.snackbar(
          'Location Selected',
          'Lat: ${result.latitude.toStringAsFixed(6)}\nLong: ${result.longitude.toStringAsFixed(6)}',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green[100],
          duration: const Duration(seconds: 2),
        );
      });
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
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            openAppSettings();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green[600],
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Settings'),
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

    if (imeiController.text.trim().length != 15) {
      Get.snackbar(
        'Validation Error',
        'IMEI must be exactly 15 digits',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
      return false;
    }

    if (!RegExp(r'^[0-9]{15}$').hasMatch(imeiController.text.trim())) {
      Get.snackbar(
        'Validation Error',
        'IMEI must contain only numbers',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
      return false;
    }

    if (locationController.text.trim().isEmpty) {
      Get.snackbar(
        'Validation Error',
        'Please enter location',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red[100],
      );
      return false;
    }

    if (motorHpController.text.trim().isEmpty) {
      Get.snackbar(
        'Validation Error',
        'Please enter motor HP',
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

      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "serial_number": serialNumber,
          "imei_number": imeiController.text.trim(),
          "user_email": userEmail,
          "timestamp": DateTime.now().toIso8601String(),
          "latitude": selectedLatitude?.toString() ?? "0",
          "longitude": selectedLongitude?.toString() ?? "0",
          "motor_hp": motorHpController.text.trim(),
        }),
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
                  const SizedBox(height: 4),
                  Text(
                    'IMEI: ${imeiController.text}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontFamily: 'monospace',
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
      } else if (response.statusCode == 404) {
        Get.snackbar(
          'Error',
          'Device not found or not assigned to you',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
        );
      } else {
        final errorData = jsonDecode(response.body);
        Get.snackbar(
          'Error',
          errorData['message'] ?? 'Failed to configure device',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red[100],
        );
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
}
