import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class MapPickerView extends StatefulWidget {
  const MapPickerView({Key? key}) : super(key: key);

  @override
  State<MapPickerView> createState() => _MapPickerViewState();
}

class _MapPickerViewState extends State<MapPickerView> {
  GoogleMapController? mapController;
  LatLng? selectedLocation;
  LatLng initialLocation = const LatLng(20.5937, 78.9629);
  LatLng? lockedLocation;
  bool isLoading = true;
  bool isMapMoved = false;
  bool isLocatingNow = false;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }



  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          isLoading = false;
        });
        _showLocationServiceDialog();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          isLoading = false;
        });
        _showLocationPermissionDialog();
        return;
      }

      if (permission == LocationPermission.denied) {
        setState(() {
          isLoading = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        initialLocation = LatLng(position.latitude, position.longitude);
        selectedLocation = initialLocation;
        isLoading = false;
      });

      mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(initialLocation, 15),
      );
    } catch (e) {
      print('Error getting location: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    mapController = controller;
  }

  void _onMapTap(LatLng location) {
    setState(() {
      selectedLocation = location;
    });
  }

  Future<void> _locateMe() async {
    setState(() {
      isLocatingNow = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Location services are disabled'),
            backgroundColor: Colors.orange[400],
            duration: const Duration(seconds: 2),
          ),
        );
        setState(() {
          isLocatingNow = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Location permission not available'),
            backgroundColor: Colors.red[400],
            duration: const Duration(seconds: 2),
          ),
        );
        setState(() {
          isLocatingNow = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      final LatLng currentLocation = LatLng(position.latitude, position.longitude);
      
      setState(() {
        selectedLocation = currentLocation;
        isLocatingNow = false;
      });

      mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(currentLocation, 17),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Location updated'),
          backgroundColor: Colors.green[600],
          duration: const Duration(seconds: 1),
        ),
      );
    } catch (e) {
      print('Error locating: $e');
      setState(() {
        isLocatingNow = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Failed to get location'),
          backgroundColor: Colors.red[400],
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _confirmLocation() {
    if (selectedLocation != null) {
      Navigator.of(context).pop(selectedLocation);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select a location on the map'),
          backgroundColor: Colors.red[300],
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _showLocationServiceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(Icons.location_off, color: Colors.orange[700]),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Location Disabled', overflow: TextOverflow.ellipsis, maxLines: 2),
            ),
          ],
        ),
        content: const Text(
          'Please enable location services in your device settings to use this feature',
          style: TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Geolocator.openLocationSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  void _showLocationPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(Icons.location_off, color: Colors.red[700]),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Permission Required', overflow: TextOverflow.ellipsis, maxLines: 2),
            ),
          ],
        ),
        content: const Text(
          'Please enable location permission in app settings to use this feature',
          style: TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          if (isLoading)
            const Center(
              child: CircularProgressIndicator(),
            )
          else
            GoogleMap(
              onMapCreated: _onMapCreated,
              initialCameraPosition: CameraPosition(
                target: initialLocation,
                zoom: 15,
              ),
              onTap: _onMapTap,
              markers: selectedLocation != null
                  ? {
                      Marker(
                        markerId: const MarkerId('selected_location'),
                        position: selectedLocation!,
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueGreen,
                        ),
                      ),
                    }
                  : {},
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              mapToolbarEnabled: false,
            ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back, color: Colors.black87),
                            onPressed: () => Navigator.pop(context),
                            tooltip: 'Back',
                          ),
                        ),
                        const Spacer(),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: IconButton(
                            icon: isLocatingNow
                                ? SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.green[600]!),
                                    ),
                                  )
                                : Icon(Icons.my_location, color: Colors.green[700], size: 22),
                            onPressed: isLocatingNow ? null : _locateMe,
                            tooltip: 'Current Location',
                          ),
                        ),
                      ],
                    ),
                    if (!isLoading)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.blue[50],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    'Tap on map to select location',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.black87,
                                      fontWeight: FontWeight.w500,
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          if (!isLoading && selectedLocation != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 16,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 24, 20, MediaQuery.of(context).padding.bottom + 20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Icons.location_on, color: Colors.green[700], size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Selected Location',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Latitude: ${selectedLocation!.latitude.toStringAsFixed(6)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.blue[700],
                                          fontFamily: 'monospace',
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Longitude: ${selectedLocation!.longitude.toStringAsFixed(6)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.green[700],
                                          fontFamily: 'monospace',
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.copy, color: Colors.blue[700], size: 18),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _confirmLocation,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green[600],
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.check_circle_outline, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'CONFIRM LOCATION',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
