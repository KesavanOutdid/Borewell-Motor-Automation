import 'package:flutter/material.dart';
import '../../../../../utils/theme/app_colors.dart';

class AboutAgriPlusPage extends StatelessWidget {
  const AboutAgriPlusPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('About AgriPlus'),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Image.asset(
                  'assets/images/image.png',
                  width: 80,
                  height: 80,
                  color: AppColors.primaryGreen,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Center(
              child: Text(
                'AgriPlus',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
            ),
            const Center(
              child: Text(
                'Smart Automation for Smart Farming',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 32),
            _buildSectionTitle('Our Mission'),
            const Text(
              'AgriPlus is dedicated to empowering farmers through innovative smart automation solutions. We aim to optimize resource usage, improve crop yields, and make farming more sustainable and efficient.',
              style: TextStyle(fontSize: 16, height: 1.5),
            ),
            const SizedBox(height: 24),
            _buildSectionTitle('Key Features'),
            _buildFeatureItem(Icons.settings_remote, 'Remote Motor Control', 'Manage your Smart motors from anywhere.'),
            _buildFeatureItem(Icons.timer, 'Automated Scheduling', 'Set timers and schedules for efficient irrigation.'),
            _buildFeatureItem(Icons.bolt, 'Power Monitoring', 'Real-time updates on power status and voltage.'),
            _buildFeatureItem(Icons.warning_amber_rounded, 'Instant Alerts', 'Get notified about faults and issues immediately.'),
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 16),
            const Center(
              child: Text(
                'Version 1.0.0',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            const Center(
              child: Text(
                '© 2024 AgriPlus Smart Automation',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: AppColors.primaryGreen,
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primaryGreen, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
