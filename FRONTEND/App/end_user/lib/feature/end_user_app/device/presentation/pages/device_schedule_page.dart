import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../controllers/device_schedule_controller.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../core/services/tour_service.dart';

class DeviceSchedulePage extends StatefulWidget {
  const DeviceSchedulePage({super.key});

  @override
  State<DeviceSchedulePage> createState() => _DeviceSchedulePageState();
}

class _DeviceSchedulePageState extends State<DeviceSchedulePage> {
  final controller = Get.put(DeviceScheduleController());
  
  DateTime? startDate;
  TimeOfDay? startTime;
  DateTime? stopDate;
  TimeOfDay? stopTime;
  
  // Track expanded cards
  final Set<String> _expandedCards = {};

  @override
  void initState() {
    super.initState();
    controller.initialize(Get.arguments);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            Get.find<TourService>().showScheduleTour(context);
          }
        });
      }
    });
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red),
            SizedBox(width: 10),
            Text('Invalid Input'),
          ],
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('OK', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? (startDate ?? now) : (stopDate ?? startDate ?? now),
      firstDate: isStart ? now : (startDate ?? now),
      lastDate: now.add(const Duration(days: 7)), // Allow up to 7 days scheduling
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryGreen,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          startDate = picked;
          if (stopDate != null && stopDate!.isBefore(startDate!)) {
            stopDate = picked;
          }
        } else {
          stopDate = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final DateTime now = DateTime.now();
    
    // Check if date is selected first
    if (isStart && startDate == null) {
      _showErrorDialog('Please select Start Date first');
      return;
    }
    if (!isStart && stopDate == null) {
      _showErrorDialog('Please select Stop Date first');
      return;
    }

    DateTime initialDateTime;
    if (isStart) {
      if (startTime != null) {
        initialDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, startTime!.hour, startTime!.minute);
      } else {
        // Default to current time + 5 minutes if today, else just current time
        final bool isToday = startDate!.year == now.year && startDate!.month == now.month && startDate!.day == now.day;
        initialDateTime = isToday ? now.add(const Duration(minutes: 5)) : DateTime(startDate!.year, startDate!.month, startDate!.day, now.hour, now.minute);
      }
    } else {
      if (stopTime != null) {
        initialDateTime = DateTime(stopDate!.year, stopDate!.month, stopDate!.day, stopTime!.hour, stopTime!.minute);
      } else {
        // Default to start time + 1 hour if stop date is same as start date
        if (startDate != null && startTime != null && stopDate != null) {
          final startDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, startTime!.hour, startTime!.minute);
          final bool isSameDay = stopDate!.year == startDate!.year && stopDate!.month == startDate!.month && stopDate!.day == startDate!.day;
          initialDateTime = isSameDay ? startDateTime.add(const Duration(hours: 1)) : DateTime(stopDate!.year, stopDate!.month, stopDate!.day, startTime!.hour, startTime!.minute);
        } else {
          initialDateTime = now.add(const Duration(hours: 2));
        }
      }
    }

    DateTime tempPickedDate = initialDateTime;

    await showCupertinoModalPopup(
      context: context,
      builder: (context) => Container(
        height: 300,
        color: Colors.white,
        child: Column(
          children: [
            Container(
              color: Colors.grey.shade100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  CupertinoButton(
                    child: Text('cancel'.tr, style: TextStyle(color: Colors.red)),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  CupertinoButton(
                    child: Text('Done', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      final pickedTime = TimeOfDay.fromDateTime(tempPickedDate);
                      
                      // Validation for today's start time - exactly 5 minutes
                      if (isStart) {
                        final bool isToday = startDate!.year == now.year && startDate!.month == now.month && startDate!.day == now.day;
                        final pickedDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, pickedTime.hour, pickedTime.minute);
                        if (isToday && pickedDateTime.isBefore(now.add(const Duration(minutes: 5)))) {
                          _showErrorDialog('Start time must be at least 5 minutes from now');
                          return;
                        }
                      } else if (startDate != null && startTime != null) {
                        // Validation for stop time > start time
                        final startDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, startTime!.hour, startTime!.minute);
                        final pickedStopDateTime = DateTime(stopDate!.year, stopDate!.month, stopDate!.day, pickedTime.hour, pickedTime.minute);
                        if (pickedStopDateTime.isBefore(startDateTime.add(const Duration(minutes: 5)))) {
                          _showErrorDialog('Stop time must be at least 5 minutes after start time');
                          return;
                        }
                      }

                      setState(() {
                        if (isStart) {
                          startTime = pickedTime;
                        } else {
                          stopTime = pickedTime;
                        }
                      });
                      Navigator.of(context).pop();
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: CupertinoDatePicker(
                mode: CupertinoDatePickerMode.time,
                initialDateTime: initialDateTime,
                onDateTimeChanged: (DateTime newDateTime) {
                  tempPickedDate = newDateTime;
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitSchedule() async {
    if (startDate == null || startTime == null || stopDate == null || stopTime == null) {
      _showErrorDialog('Please select both start and stop date/time');
      return;
    }

    final startDateTime = DateTime(
      startDate!.year, startDate!.month, startDate!.day,
      startTime!.hour, startTime!.minute,
    );
    
    final stopDateTime = DateTime(
      stopDate!.year, stopDate!.month, stopDate!.day,
      stopTime!.hour, stopTime!.minute,
    );

    final now = DateTime.now();
    
    // Validate start date (not yesterday)
    final todayStart = DateTime(now.year, now.month, now.day);
    if (startDateTime.isBefore(todayStart)) {
      _showErrorDialog('Start date cannot be in the past');
      return;
    }

    // Validate 5 minutes lead time
    if (startDateTime.isBefore(now.add(const Duration(minutes: 5)))) {
      _showErrorDialog('Start time must be at least 5 minutes from now');
      return;
    }

    // Validate stop after start (minimum 5 minutes)
    if (stopDateTime.isBefore(startDateTime.add(const Duration(minutes: 5)))) {
      _showErrorDialog('Stop time must be at least 5 minutes after start time');
      return;
    }

    // Confirm with user
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Schedule'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to set this schedule?'),
            SizedBox(height: 15),
            Text('Start  ${DateFormat('dd MMM, h:mm a').format(startDateTime)}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('Stop   ${DateFormat('dd MMM, h:mm a').format(stopDateTime)}', style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text('cancel'.tr, style: TextStyle(color: Colors.grey))),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true), 
            child: Text('Confirm', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    final success = await controller.createSchedule(startDateTime, stopDateTime);

    if (success) {
      setState(() {
        startDate = null; startTime = null;
        stopDate = null; stopTime = null;
      });
      controller.fetchSchedules();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: Text('Scheduler', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () async {
          await controller.fetchSchedules();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: KeyedSubtree(
                key: Get.find<TourService>().scheduleFormKey,
                child: _buildScheduleForm(),
              ),
            ),
            SliverToBoxAdapter(
              child: KeyedSubtree(
                key: Get.find<TourService>().scheduleListKey,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Row(
                    children: [
                      Text(
                        'Active/Past Schedules',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(child: _buildStatusFilters()),
            SliverPadding(
              padding: const EdgeInsets.only(bottom: 20),
              sliver: _buildScheduleList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleForm() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [AppColors.cardShadow],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildSectionTitle('START (Date & Time)', AppColors.primaryGreen, Icons.play_circle_fill),
              SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _buildPickerTile(startDate == null ? 'Select Date' : DateFormat('dd MMM, yyyy').format(startDate!), Icons.event_note, () => _selectDate(context, true))),
                  SizedBox(width: 8),
                  Expanded(
                    child: Opacity(
                      opacity: startDate == null ? 0.6 : 1.0,
                      child: _buildPickerTile(startTime == null ? 'Select Time' : DateFormat('h:mm a').format(DateTime(0,0,0, startTime!.hour, startTime!.minute)), Icons.schedule, () => _selectTime(context, true)),
                    ),
                  ),
                ],
              ),
              
              SizedBox(height: 16),
              
              _buildSectionTitle('STOP (Date & Time)', AppColors.error, Icons.stop_circle),
              SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _buildPickerTile(stopDate == null ? 'Select Date' : DateFormat('dd MMM, yyyy').format(stopDate!), Icons.event_note, () => _selectDate(context, false))),
                  SizedBox(width: 8),
                  Expanded(
                    child: Opacity(
                      opacity: stopDate == null ? 0.6 : 1.0,
                      child: _buildPickerTile(stopTime == null ? 'Select Time' : DateFormat('h:mm a').format(DateTime(0,0,0, stopTime!.hour, stopTime!.minute)), Icons.schedule, () => _selectTime(context, false)),
                    ),
                  ),
                ],
              ),

              SizedBox(height: 32),
              Obx(() => Container(
                height: 54,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: controller.isLoading.value 
                    ? null 
                    : const LinearGradient(
                        colors: [Color(0xFF00B894), Color(0xFF00A382)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                  boxShadow: [
                    if (!controller.isLoading.value)
                      BoxShadow(
                        color: const Color(0xFF00B894).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: controller.isLoading.value ? null : _submitSchedule,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  ),
                  child: controller.isLoading.value 
                    ? SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                    : Text('CONFIRM SCHEDULE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.2)),
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, Color color, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        SizedBox(width: 8),
        Text(
          title, 
          style: TextStyle(
            fontSize: 14, 
            fontWeight: FontWeight.w800, 
            letterSpacing: 0.5, 
            color: color
          )
        ),
      ],
    );
  }

  Widget _buildPickerTile(String value, IconData icon, VoidCallback onTap) {
    bool isPlaceholder = value.contains('Select');
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isPlaceholder ? Colors.grey.withOpacity(0.2) : AppColors.primaryGreen.withOpacity(0.3),
            width: 1.5
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isPlaceholder ? AppColors.textMuted : AppColors.primaryGreen),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                value, 
                style: TextStyle(
                  fontWeight: FontWeight.bold, 
                  color: isPlaceholder ? AppColors.textMuted : AppColors.textPrimary,
                  fontSize: 12
                ), 
                overflow: TextOverflow.ellipsis
              )
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilters() {
    final filters = ['All', 'Pending', 'Started', 'Completed', 'Stopped', 'Cancelled', 'Failed'];
    return SizedBox(
      height: 45,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          return Obx(() {
            final isSelected = controller.selectedStatus.value == filter;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(
                  filter,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 12,
                  ),
                ),
                selected: isSelected,
                onSelected: (selected) {
                  controller.selectedStatus.value = filter;
                  controller.fetchSchedules();
                },
                selectedColor: AppColors.primaryGreen,
                backgroundColor: Colors.white,
                checkmarkColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(
                    color: isSelected ? AppColors.primaryGreen : Colors.grey.shade300,
                  ),
                ),
                showCheckmark: false,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
            );
          });
        },
      ),
    );
  }

  Widget _buildScheduleList() {
    return Obx(() {
      if (controller.isLoading.value && controller.schedules.isEmpty) {
        return const SliverFillRemaining(child: Center(child: CircularProgressIndicator()));
      }
      if (controller.schedules.isEmpty) {
        return SliverFillRemaining(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.event_busy, size: 64, color: Colors.grey.withOpacity(0.3)),
                SizedBox(height: 16),
                Text('No schedules found', style: TextStyle(color: AppColors.textMuted)),
              ],
            ),
          ),
        );
      }
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final s = controller.schedules[index];
            final id = s['_id'] as String;
            final start = DateTime.parse(s['start_time']).toLocal();
            final stop = DateTime.parse(s['stop_time']).toLocal();
            final status = s['status'] as String;
            final createdBy = s['user_name'] ?? 'User';
            final startedBy = s['started_by'];
            final stoppedBy = s['stopped_by'];
            final cancelledBy = s['cancelled_by'];
            
            final isExpanded = _expandedCards.contains(id);
            
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isExpanded) {
                    _expandedCards.remove(id);
                  } else {
                    _expandedCards.add(id);
                  }
                });
              },
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [AppColors.softShadow],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border(
                        left: BorderSide(color: _getStatusColor(status), width: 6),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildStatusBadge(status),
                              if (status == 'pending')
                                IconButton(
                                  icon: const Icon(Icons.cancel_outlined, color: Colors.red, size: 20),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  onPressed: () => controller.cancelSchedule(id),
                                ),
                            ],
                          ),
                          SizedBox(height: 12),
                          Row(
                            children: [
                              _buildTimeInfo(Icons.play_arrow_rounded, 'Start', start, AppColors.primaryGreen),
                              const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.grey),
                              _buildTimeInfo(Icons.stop_rounded, 'Stop', stop, Colors.red),
                            ],
                          ),
                          
                          if (isExpanded) ...[
                            SizedBox(height: 12),
                            const Divider(height: 1),
                            SizedBox(height: 12),
                            _buildDetailRow(Icons.person_add_alt_1_outlined, 'Created by', createdBy, Colors.blue),
                            if (startedBy != null)
                              _buildDetailRow(Icons.play_circle_outlined, 'Started by', startedBy, AppColors.primaryGreen),
                            if (stoppedBy != null)
                              _buildDetailRow(Icons.stop_circle_outlined, 'Stopped by', stoppedBy, Colors.red),
                            if (status == 'cancelled' && cancelledBy != null)
                              _buildDetailRow(Icons.cancel_outlined, 'Cancelled by', cancelledBy, Colors.orange),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
          childCount: controller.schedules.length,
        ),
      );
    });
  }

  Widget _buildStatusBadge(String status) {
    final color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(status), color: color, size: 14),
          SizedBox(width: 6),
          Text(
            status.toUpperCase(),
            style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeInfo(IconData icon, String label, DateTime dateTime, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              SizedBox(width: 4),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500)),
            ],
          ),
          SizedBox(height: 4),
          Text(
            DateFormat('dd MMM').format(dateTime),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
          Text(
            DateFormat('h:mm a').format(dateTime),
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color.withOpacity(0.7)),
          SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch(status.toLowerCase()) {
      case 'pending': return AppColors.warning;
      case 'started': return AppColors.primaryBlue;
      case 'completed': return AppColors.success;
      case 'cancelled': return Colors.grey;
      case 'stopped': return Colors.orange;
      case 'failed': return AppColors.error;
      default: return Colors.black;
    }
  }

  IconData _getStatusIcon(String status) {
    switch(status.toLowerCase()) {
      case 'pending': return Icons.timer_outlined;
      case 'started': return Icons.play_circle_filled;
      case 'completed': return Icons.check_circle;
      case 'cancelled': return Icons.cancel;
      case 'stopped': return Icons.front_hand_outlined;
      case 'failed': return Icons.error;
      default: return Icons.help_outline;
    }
  }
}
