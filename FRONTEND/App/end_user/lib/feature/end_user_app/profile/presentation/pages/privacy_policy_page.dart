import 'package:flutter/material.dart';

class PrivacyPolicyView extends StatelessWidget {
  const PrivacyPolicyView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSection(
                context,
                'Introduction',
                'This Privacy Policy explains how we collect, use, and protect your personal information when you use our Smart Motor Automation application.',
              ),
              _buildSection(
                context,
                'Information We Collect',
                '• Personal identification information (name, email, phone number)\n'
                '• Device information and usage data\n'
                '• Authentication credentials\n'
                '• Motor and automation system data\n'
                '• Location data (if permitted)',
              ),
              _buildSection(
                context,
                'How We Use Your Information',
                '• To provide and maintain our services\n'
                '• To send you updates and notifications\n'
                '• To improve our application\n'
                '• To communicate with you about changes or issues\n'
                '• To ensure security and prevent fraud',
              ),
              _buildSection(
                context,
                'Data Protection',
                'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.',
              ),
              _buildSection(
                context,
                'Third-Party Services',
                'Our application may contain links to third-party services. We are not responsible for the privacy practices of these services. We encourage you to review their privacy policies.',
              ),
              _buildSection(
                context,
                'Your Rights',
                '• You have the right to access your personal information\n'
                '• You can request deletion of your data\n'
                '• You can opt-out of promotional communications\n'
                '• You have the right to correct inaccurate information',
              ),
              _buildSection(
                context,
                'Contact Us',
                'If you have any questions about this Privacy Policy, please contact us at contact@gmail.com',
              ),
              const SizedBox(height: 20),
              Text(
                'Last Updated: November 2025',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).brightness == Brightness.dark ? Colors.green.shade400 : Colors.green[700],
              ),
        ),
        const SizedBox(height: 8),
        Text(
          content,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
