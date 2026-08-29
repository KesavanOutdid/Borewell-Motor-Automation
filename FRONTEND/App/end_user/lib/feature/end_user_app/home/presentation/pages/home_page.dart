import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';
import '../controllers/home_controller.dart';
import '../../../../../core/services/notification_storage_service.dart';
import '../../../../../core/services/tour_service.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/ui_components.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final notificationStorage = NotificationStorageService();
    final tourService = Get.find<TourService>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 800), () {
        if (context.mounted) {
          tourService.showHomeTour(context);
        }
      });
    });
    
    return Stack(
      children: [
        Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
                image: DecorationImage(
                  image: AssetImage('assets/images/Gemini_Generated_Image_8ytdc78ytdc78ytd.png'),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(
                    Colors.black38,
                    BlendMode.darken,
                  ),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        GestureDetector(
                          key: tourService.menuKey,
                          onTap: () => Scaffold.of(context).openDrawer(),
                          child: Container(
                            height: 48,
                            width: 48,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: const Icon(
                              Icons.menu_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'home'.tr,
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                ),
                              ),
                      
                            ],
                          ),
                        ),
                        StreamBuilder<int>(
                          stream: Stream.periodic(const Duration(seconds: 3), (_) {
                            return notificationStorage.getUnreadCount();
                          }),
                          builder: (context, snapshot) {
                            final unreadCount = snapshot.data ?? notificationStorage.getUnreadCount();
                            return GestureDetector(
                              key: tourService.notificationsKey,
                              onTap: () => Get.toNamed('/notifications'),
                              child: Container(
                                height: 48,
                                width: 48,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.18),
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  alignment: Alignment.center,
                                  children: [
                                    const Icon(
                                      Icons.notifications_rounded,
                                      color: Colors.white,
                                      size: 24,
                                    ),
                                    if (unreadCount > 0)
                                      Positioned(
                                        right: -4,
                                        top: -4,
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: Colors.red,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white, width: 1.5),
                                            boxShadow: [
                                              BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 6),
                                            ],
                                          ),
                                          constraints: const BoxConstraints(
                                            minWidth: 18,
                                            minHeight: 18,
                                          ),
                                          child: Text(
                                            unreadCount > 99 ? '99+' : unreadCount.toString(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w800,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Container(
              key: tourService.filterKey,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Obx(() => SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('recently'.tr, 'Recently'),
                    const SizedBox(width: 8),
                    _buildFilterChip('all'.tr, 'All'),
                    const SizedBox(width: 8),
                    _buildFilterChip('running'.tr, 'Running'),
                    const SizedBox(width: 8),
                    _buildFilterChip('stopped'.tr, 'Stopped'),
                    const SizedBox(width: 8),
                    _buildFilterChip('online'.tr, 'Online'),
                    const SizedBox(width: 8),
                    _buildFilterChip('offline'.tr, 'Offline'),
                    const SizedBox(width: 8),
                    _buildFilterChip('access'.tr, 'Access'),
                    const SizedBox(width: 8),
                    _buildFilterChip('not_configured'.tr, 'Not Configured'),
                  ],
                ),
              )),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primaryGreen,
                onRefresh: () async => await controller.fetchDevices(),
                child: Obx(() {
                  if (controller.isLoading.value && controller.devices.isEmpty) {
                    return _buildSkeletonList();
                  }

                  if (controller.errorMessage.value.isNotEmpty) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: NetworkErrorWidget(
                          message: controller.errorMessage.value,
                          onRetry: () => controller.fetchDevices(),
                        ),
                      ),
                    );
                  }

                  if (controller.devices.isEmpty) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.primaryGreen.withValues(alpha: 0.1),
                                      AppColors.emerald.withValues(alpha: 0.05),
                                    ],
                                  ),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.devices_other,
                                  size: 64,
                                  color: AppColors.primaryGreen.withValues(alpha: 0.5),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'no_devices_assigned'.tr,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).textTheme.titleLarge?.color,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'contact_admin_to_assign_devices'.tr,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Theme.of(context).textTheme.bodyMedium?.color,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  List<Map<String, dynamic>> displayDevices = controller.displayDevices;
                  
                  if (displayDevices.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                'no_devices_found'.tr,
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.builder(
                    controller: controller.scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    itemCount: displayDevices.length + (controller.isLoadingMore.value ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index < displayDevices.length) {
                        final device = displayDevices[index];
                        final isConfigured = controller.isDeviceConfigured(device);
                        final isRunning = controller.isDeviceRunning(device);
                        return _buildDeviceListCard(device, isConfigured, isRunning);
                      } else {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: AppColors.primaryGreen,
                              strokeWidth: 2,
                            ),
                          ),
                        );
                      }
                    },
                  );
                }),
              ),
            ),
          ],
        ),
        Positioned(
          left: 16,
          bottom: 24,
          child: GestureDetector(
            key: tourService.addDeviceKey,
            onTap: () => controller.showAddDeviceDialog(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryGreen.withOpacity(0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                    spreadRadius: -2,
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    'add'.tr,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _navigateDevice(Map<String, dynamic> device) async {
    final route = controller.isDeviceConfigured(device)
        ? '/device/details'
        : '/device/configure';
    await Get.toNamed(route, arguments: device);
    controller.fetchDevices();
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = controller.selectedFilter.value == value;
    
    return GestureDetector(
      onTap: () => controller.setFilter(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : Colors.grey.shade300,
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primaryGreen.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildDeviceListCard(Map<String, dynamic> device, bool isConfigured, bool isRunning) {
    final deviceId = device['serial_number'] ?? device['serialNumber'] ?? 'N/A';
    final deviceNickname = device['device_nickname'] ?? device['device_name'];
    final deviceName = (deviceNickname != null && deviceNickname.toString().isNotEmpty) ? deviceNickname : deviceId;
    final lat = device['latitude'];
    final lng = device['longitude'];
    final latStr = lat?.toString();
    final lngStr = lng?.toString();
    final isZeroLocation = (latStr == '0' && lngStr == '0') || (latStr == '0.0' && lngStr == '0.0');
    
    final location = (device['location'] != null && device['location'].toString().isNotEmpty && device['location'] != 'No Location')
        ? device['location'].toString()
        : (lat != null && lng != null && !isZeroLocation ? "$lat, $lng" : "No Location");
    final hasLocation = location != 'No Location';
    final imei = device['imei_number'] ?? device['imeiNumber'] ?? 'N/A';
    final isOnline = controller.isOnline(device);
    
    final simInfo = device['sim_details'] is Map
        ? Map<String, dynamic>.from(device['sim_details'])
        : (device['sim_id'] is Map ? Map<String, dynamic>.from(device['sim_id']) : null);
    final simPhone = simInfo?['phone_number']?.toString() ?? simInfo?['sim_phone']?.toString() ?? device['phone_number']?.toString() ?? device['sim_phone']?.toString();

    final deviceStatus = !isConfigured 
        ? 'not_configured'.tr 
        : (isRunning ? 'running'.tr : (isOnline ? 'idle'.tr : 'offline'.tr));
    
    final statusColor = !isConfigured 
        ? AppColors.primaryOrange 
        : (isRunning ? AppColors.primaryGreen : (isOnline ? AppColors.textMuted : Colors.grey));
    
    final acceptanceStatus = device['acceptance_status'] ?? 'accepted';
    final isPending = acceptanceStatus == 'pending';
    
    final nextSchedule = device['next_schedule'];
    String? nextStartTime;
    String? nextStopTime;
    if (nextSchedule != null) {
      try {
        if (nextSchedule['status'] == 'started' && nextSchedule['stop_time'] != null) {
          final stopTime = DateTime.parse(nextSchedule['stop_time'].toString()).toLocal();
          nextStopTime = DateFormat('hh:mm a').format(stopTime);
        } else if (nextSchedule['start_time'] != null) {
          final startTime = DateTime.parse(nextSchedule['start_time'].toString()).toLocal();
          nextStartTime = DateFormat('hh:mm a').format(startTime);
        }
      } catch (e) {
        print('Error parsing next schedule: $e');
      }
    }
    
    return GestureDetector(
      onTap: isPending ? null : () => _navigateDevice(device),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 15,
              offset: const Offset(0, 4),
              spreadRadius: -2,
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Left Icon/Image section
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    !isConfigured ? Icons.settings_rounded : Icons.water_drop_rounded,
                    color: statusColor,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                // Middle Content section
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              deviceName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                                letterSpacing: -0.5,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          if (isRunning)
                            const _PulsingDot(color: AppColors.primaryGreen)
                          else
                            Icon(
                              Icons.wifi_rounded,
                              size: 14,
                              color: isOnline ? AppColors.primaryGreen : Colors.grey.shade400,
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (hasLocation)
                        Row(
                          children: [
                            const Icon(Icons.location_on_rounded, size: 14, color: AppColors.primaryGreen),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                location,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey.shade600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 2),
                      RichText(
                        text: TextSpan(
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey.shade500,
                          ),
                          children: [
                            TextSpan(
                              text: '${'sn_label'.tr} ',
                              style: const TextStyle(
                                color: AppColors.primaryGreen,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TextSpan(text: deviceId),
                            if (simPhone != null && simPhone.isNotEmpty) ...[
                              const TextSpan(text: ' • '),
                              const TextSpan(
                                text: 'SIM: ',
                                style: TextStyle(
                                  color: AppColors.primaryGreen,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              TextSpan(text: simPhone),
                            ],
                          ],
                        ),
                      ),
                      if (nextStartTime != null && !isRunning) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 12, color: AppColors.primaryOrange),
                            const SizedBox(width: 4),
                            Text(
                              '${'starts_at'.tr} $nextStartTime',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryOrange,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (nextStopTime != null && isRunning) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.timer_rounded, size: 12, color: AppColors.primaryGreen),
                            const SizedBox(width: 4),
                            Text(
                              '${'stops_at'.tr} $nextStopTime',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Right Action section
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: statusColor.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            deviceStatus,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: statusColor,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // if (isConfigured) ...[
                    //   const SizedBox(height: 4),
                    //   Text(
                    //     controller.getLastSeenText(device),
                    //     style: TextStyle(
                    //       fontSize: 8,
                    //       color: Colors.grey.shade500,
                    //       fontWeight: FontWeight.w500,
                    //     ),
                    //   ),
                    // ],
                    if (!isPending && isConfigured) ...[
                      const SizedBox(height: 8),
                      Obx(() {
                        final isProcessing = controller.processingDevices.contains(deviceId);
                        return GestureDetector(
                          onTap: (!isProcessing) ? () => controller.toggleDevice(deviceId, imei, !isRunning) : null,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isProcessing ? Colors.grey.shade400 : (isRunning ? Colors.red : AppColors.primaryGreen),
                              shape: BoxShape.circle,
                            ),
                            child: isProcessing
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Icon(
                                    isRunning ? Icons.stop_rounded : Icons.play_arrow_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ],
            ),
            if (isPending) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => controller.respondToAccess(deviceId, 'accepted'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text('accept'.tr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => controller.respondToAccess(deviceId, 'rejected'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text('reject'.tr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSkeletonList() {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: 5,
      itemBuilder: (context, index) => _buildSkeletonCard(),
    );
  }

  Widget _buildSkeletonCard() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: Color(0xFFF5F5F5), width: 1),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 120,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 180,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 100,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: 60,
                  height: 18,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) => Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          color: widget.color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: widget.color.withOpacity(0.2 + _controller.value * 0.5),
              blurRadius: 4 + _controller.value * 8,
              spreadRadius: _controller.value * 3,
            ),
          ],
        ),
      ),
    );
  }
}
