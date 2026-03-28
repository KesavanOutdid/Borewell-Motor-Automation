import 'package:flutter/material.dart';
import '../../../../../utils/theme/app_colors.dart';

class AboutAgriPlusPage extends StatelessWidget {
  const AboutAgriPlusPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primaryGreen,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF059669), Color(0xFF10B981), Color(0xFF14B8A6)],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -60,
                      top: -60,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.08),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Positioned(
                      left: -40,
                      bottom: -20,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 40),
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 20,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Image.asset(
                                'assets/images/image.png',
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.water_drop_rounded,
                                  size: 36,
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'AgriPlus',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'Smart Automation for Smart Farming',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withOpacity(0.8),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              title: const Text(
                'About AgriPlus',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
              ),
            ),
          ),
          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Our Mission'),
                  const Text(
                    'AgriPlus is dedicated to empowering farmers through innovative smart automation solutions. We aim to optimize resource usage, improve crop yields, and make farming more sustainable and efficient.',
                    style: TextStyle(fontSize: 15, height: 1.6),
                  ),
                  const SizedBox(height: 28),
                  _buildSectionTitle('Key Features'),
                  const SizedBox(height: 4),
                  _buildFeatureItem(
                    Icons.settings_remote_rounded,
                    'Remote Motor Control',
                    'Manage your Smart motors from anywhere.',
                    const Color(0xFF3B82F6),
                  ),
                  _buildFeatureItem(
                    Icons.timer_rounded,
                    'Automated Scheduling',
                    'Set timers and schedules for efficient irrigation.',
                    const Color(0xFF9D4EDD),
                  ),
                  _buildFeatureItem(
                    Icons.bolt_rounded,
                    'Power Monitoring',
                    'Real-time updates on power status and voltage.',
                    const Color(0xFFFF8A00),
                  ),
                  _buildFeatureItem(
                    Icons.warning_amber_rounded,
                    'Instant Alerts',
                    'Get notified about faults and issues immediately.',
                    AppColors.error,
                  ),
                  const SizedBox(height: 32),
                  Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade200),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'Version 1.0.0',
                      style: TextStyle(
                        color: isDark ? Colors.grey.shade600 : Colors.grey.shade400,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      '© 2024 AgriPlus Smart Automation',
                      style: TextStyle(
                        color: isDark ? Colors.grey.shade700 : Colors.grey.shade400,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
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
          fontWeight: FontWeight.w800,
          color: AppColors.primaryGreen,
          letterSpacing: -0.3,
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String description, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
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
