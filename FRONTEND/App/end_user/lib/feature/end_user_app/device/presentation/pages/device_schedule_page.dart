import 'package:flutter/material.dart';
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
      lastDate: now.add(const Duration(days: 7)),
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
        } else {
          stopDate = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isStart ? (startTime ?? TimeOfDay.now()) : (stopTime ?? startTime ?? TimeOfDay.now()),
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
          startTime = picked;
        } else {
          stopTime = picked;
        }
      });
    }
  }

  void _submitSchedule() {
    if (startDate == null || startTime == null || stopDate == null || stopTime == null) {
      Get.snackbar('Error', 'Please select both start and stop date/time',
          backgroundColor: Colors.red, colorText: Colors.white);
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

    // Validation: 1 hour buffer
    if (startDateTime.isBefore(now.add(const Duration(minutes: 59)))) {
      Get.snackbar('Error', 'Start time must be at least 1 hour from now',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    // Validation: Stop after start
    if (stopDateTime.isBefore(startDateTime)) {
      Get.snackbar('Error', 'Stop time must be after start time',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    controller.createSchedule(startDateTime, stopDateTime).then((success) {
      if (success) {
        setState(() {
          startDate = null; startTime = null;
          stopDate = null; stopTime = null;
        });
      }
    });
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
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Schedule New Task', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildPickerTile('Start Date', startDate == null ? 'Select' : DateFormat('dd/MM/yyyy').format(startDate!), Icons.calendar_today, () => _selectDate(context, true))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildPickerTile('Start Time', startTime == null ? 'Select' : startTime!.format(context), Icons.access_time, () => _selectTime(context, true))),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildPickerTile('Stop Date', stopDate == null ? 'Select' : DateFormat('dd/MM/yyyy').format(stopDate!), Icons.calendar_today, () => _selectDate(context, false))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildPickerTile('Stop Time', stopTime == null ? 'Select' : stopTime!.format(context), Icons.access_time, () => _selectTime(context, false))),
                ],
              ),
              const SizedBox(height: 24),
              Obx(() => ElevatedButton(
                onPressed: controller.isLoading.value ? null : _submitSchedule,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: controller.isLoading.value 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('CONFIRM SCHEDULE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
