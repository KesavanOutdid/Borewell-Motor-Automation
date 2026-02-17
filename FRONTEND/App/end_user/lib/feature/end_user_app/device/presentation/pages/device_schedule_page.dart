import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../controllers/device_schedule_controller.dart';
import '../../../../../utils/theme/app_colors.dart';
import '../../../../../utils/widgets/gradient_widgets.dart';

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
  bool isRecurring = false;

  @override
  void initState() {
    super.initState();
    controller.initialize(Get.arguments);
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? (startDate ?? now) : (stopDate ?? startDate ?? now),
      firstDate: isStart ? now : (startDate ?? now),
      lastDate: now.add(const Duration(days: 30)), // Allow up to 30 days scheduling
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
          // If not recurring, keep stop date same as start date
          if (!isRecurring) {
            stopDate = picked;
          } else if (stopDate != null && stopDate!.isBefore(startDate!)) {
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
      Get.snackbar('Error', 'Please select Start Date first',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }
    if (!isStart && stopDate == null) {
      Get.snackbar('Error', 'Please select Stop Date first',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    DateTime initialDateTime;
    if (isStart) {
      if (startTime != null) {
        initialDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, startTime!.hour, startTime!.minute);
      } else {
        // Default to current time + 1 hour if today, else just current time
        final bool isToday = startDate!.year == now.year && startDate!.month == now.month && startDate!.day == now.day;
        initialDateTime = isToday ? now.add(const Duration(hours: 1)) : DateTime(startDate!.year, startDate!.month, startDate!.day, now.hour, now.minute);
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
                    child: const Text('Cancel', style: TextStyle(color: Colors.red)),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  CupertinoButton(
                    child: const Text('Done', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      final pickedTime = TimeOfDay.fromDateTime(tempPickedDate);
                      
                      // Validation for today's start time
                      if (isStart) {
                        final bool isToday = startDate!.year == now.year && startDate!.month == now.month && startDate!.day == now.day;
                        final pickedDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, pickedTime.hour, pickedTime.minute);
                        if (isToday && pickedDateTime.isBefore(now.add(const Duration(minutes: 55)))) {
                          Get.snackbar('Invalid Time', 'Start time must be at least 1 hour from now',
                              backgroundColor: Colors.red, colorText: Colors.white);
                          return;
                        }
                      } else if (startDate != null && startTime != null) {
                        // Validation for stop time > start time
                        final startDateTime = DateTime(startDate!.year, startDate!.month, startDate!.day, startTime!.hour, startTime!.minute);
                        final pickedStopDateTime = DateTime(stopDate!.year, stopDate!.month, stopDate!.day, pickedTime.hour, pickedTime.minute);
                        if (pickedStopDateTime.isBefore(startDateTime.add(const Duration(minutes: 1)))) {
                          Get.snackbar('Invalid Time', 'Stop time must be after start time',
                              backgroundColor: Colors.red, colorText: Colors.white);
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
      Get.snackbar('Error', 'Please select both start and stop date/time',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    final now = DateTime.now();
    final int daysCount = stopDate!.difference(startDate!).inDays + 1;
    
    if (daysCount <= 0) {
      Get.snackbar('Error', 'End date must be after start date',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    int successCount = 0;
    controller.isLoading.value = true;

    for (int i = 0; i < daysCount; i++) {
      final currentDay = startDate!.add(Duration(days: i));
      
      final startDateTime = DateTime(
        currentDay.year, currentDay.month, currentDay.day,
        startTime!.hour, startTime!.minute,
      );
      
      final stopDateTime = DateTime(
        currentDay.year, currentDay.month, currentDay.day,
        stopTime!.hour, stopTime!.minute,
      );

      // Skip if start time is already in the past
      if (startDateTime.isBefore(now)) continue;

      // Ensure stop is after start for same day
      if (stopDateTime.isBefore(startDateTime)) {
        // If it's not a recurring schedule, show error. 
        // If it is recurring, we skip invalid configurations (though our picker logic should prevent this)
        if (!isRecurring) {
          Get.snackbar('Error', 'Stop time must be after start time',
              backgroundColor: Colors.red, colorText: Colors.white);
          controller.isLoading.value = false;
          return;
        }
        continue;
      }

      final success = await controller.createSchedule(startDateTime, stopDateTime);
      if (success) successCount++;
    }

    controller.isLoading.value = false;

    if (successCount > 0) {
      Get.snackbar('Success', 'Created $successCount schedules successfully',
          backgroundColor: Colors.green, colorText: Colors.white);
      setState(() {
        startDate = null; startTime = null;
        stopDate = null; stopTime = null;
        isRecurring = false;
      });
      controller.fetchSchedules();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Auto Start/Stop'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
        ),
      ),
      body: Column(
        children: [
          _buildScheduleForm(),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Active/Past Schedules', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ),
          Expanded(child: _buildScheduleList()),
        ],
      ),
    );
  }

  Widget _buildScheduleForm() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Card(
        elevation: 8,
        shadowColor: Colors.black.withOpacity(0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Schedule Motor', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primaryGreen, letterSpacing: -0.5)),
                      Text('Configure dates and times', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isRecurring ? AppColors.primaryGreen.withOpacity(0.1) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Text('Repeat Daily', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isRecurring ? AppColors.primaryGreen : Colors.grey.shade600)),
                        const SizedBox(width: 4),
                        SizedBox(
                          height: 24,
                          width: 32,
                          child: Switch(
                            value: isRecurring,
                            onChanged: (value) {
                              setState(() {
                                isRecurring = value;
                                if (!isRecurring) {
                                  stopDate = startDate;
                                }
                              });
                            },
                            activeColor: AppColors.primaryGreen,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // 1. DATES SECTION
              const Row(
                children: [
                  Icon(Icons.calendar_month_outlined, size: 18, color: AppColors.primaryGreen),
                  SizedBox(width: 8),
                  Text('1. SELECT DATES', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.0, color: AppColors.primaryGreen)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildPickerTile(isRecurring ? 'From Date' : 'Start Date', startDate == null ? 'Select' : DateFormat('dd MMM, yyyy').format(startDate!), Icons.today, () => _selectDate(context, true))),
                  const SizedBox(width: 12),
                  Expanded(child: _buildPickerTile(isRecurring ? 'Until Date' : 'Stop Date', stopDate == null ? 'Select' : DateFormat('dd MMM, yyyy').format(stopDate!), Icons.event, () => _selectDate(context, false))),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // 2. TIMES SECTION
              const Row(
                children: [
                  Icon(Icons.access_time_outlined, size: 18, color: AppColors.primaryGreen),
                  SizedBox(width: 8),
                  Text('2. SELECT TIMES', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.0, color: AppColors.primaryGreen)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Opacity(
                      opacity: startDate == null ? 0.5 : 1.0,
                      child: _buildPickerTile(isRecurring ? 'Daily Start' : 'Start Time', startTime == null ? 'Select' : startTime!.format(context), Icons.play_circle_outline, () => _selectTime(context, true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Opacity(
                      opacity: stopDate == null ? 0.5 : 1.0,
                      child: _buildPickerTile(isRecurring ? 'Daily Stop' : 'Stop Time', stopTime == null ? 'Select' : stopTime!.format(context), Icons.stop_circle, () => _selectTime(context, false)),
                    ),
                  ),
                ],
              ),

              if (isRecurring && startDate != null && stopDate != null)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryGreen.withOpacity(0.1)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: AppColors.primaryGreen),
                        const SizedBox(width: 8),
                        Text(
                          'Will repeat every day for ${stopDate!.difference(startDate!).inDays + 1} days',
                          style: const TextStyle(fontSize: 12, color: AppColors.primaryGreen, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              
              const SizedBox(height: 24),
              Obx(() => Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: controller.isLoading.value ? null : AppColors.primaryGradient,
                  boxShadow: [
                    if (!controller.isLoading.value)
                      BoxShadow(
                        color: AppColors.primaryGreen.withOpacity(0.3),
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
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: controller.isLoading.value 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(isRecurring ? 'CONFIRM ALL SCHEDULES' : 'CONFIRM SCHEDULE', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 0.5)),
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerTile(String label, String value, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(10),
          color: Colors.grey.shade50,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(icon, size: 16, color: AppColors.primaryGreen),
                const SizedBox(width: 8),
                Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleList() {
    return Obx(() {
      if (controller.isLoading.value && controller.schedules.isEmpty) {
        return const Center(child: CircularProgressIndicator());
      }
      if (controller.schedules.isEmpty) {
        return const Center(child: Text('No schedules found'));
      }
      return ListView.builder(
        itemCount: controller.schedules.length,
        itemBuilder: (context, index) {
          final s = controller.schedules[index];
          final start = DateTime.parse(s['start_time']);
          final stop = DateTime.parse(s['stop_time']);
          final status = s['status'] as String;
          
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getStatusColor(status).withOpacity(0.1),
                child: Icon(_getStatusIcon(status), color: _getStatusColor(status), size: 20),
              ),
              title: Text('Start: ${DateFormat('dd MMM, hh:mm a').format(start)}'),
              subtitle: Text('Stop: ${DateFormat('dd MMM, hh:mm a').format(stop)}'),
              trailing: status == 'pending' 
                ? IconButton(icon: const Icon(Icons.cancel, color: Colors.red), onPressed: () => controller.cancelSchedule(s['_id']))
                : Text(status.toUpperCase(), style: TextStyle(color: _getStatusColor(status), fontWeight: FontWeight.bold, fontSize: 10)),
            ),
          );
        },
      );
    });
  }

  Color _getStatusColor(String status) {
    switch(status) {
      case 'pending': return Colors.orange;
      case 'started': return Colors.blue;
      case 'completed': return Colors.green;
      case 'cancelled': return Colors.grey;
      case 'failed': return Colors.red;
      default: return Colors.black;
    }
  }

  IconData _getStatusIcon(String status) {
    switch(status) {
      case 'pending': return Icons.timer_outlined;
      case 'started': return Icons.play_arrow;
      case 'completed': return Icons.check_circle;
      case 'cancelled': return Icons.cancel_outlined;
      case 'failed': return Icons.error_outline;
      default: return Icons.help_outline;
    }
  }
}
