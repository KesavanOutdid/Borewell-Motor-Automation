import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class ContactView extends StatelessWidget {
  const ContactView({super.key});

  void _launchPhone(String phoneNumber) async {
    final url = 'tel:$phoneNumber';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  void _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
    );
    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
      }
    } catch (e) {
      print('Error launching email: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Us'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              Center(
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Theme.of(context).brightness == Brightness.dark ? Colors.green.shade900.withOpacity(0.3) : Colors.green[100],
                  ),
                  child: Icon(
                    Icons.headset_mic,
                    size: 50,
                    color: Theme.of(context).brightness == Brightness.dark ? Colors.green.shade400 : Colors.green[700],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Get in Touch',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                "We're here to help. Reach out to us with any questions, concerns, or feedback.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontSize: 14),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: _buildContactCard(
                      context,
                      icon: Icons.phone,
                      title: 'Call us',
                      subtitle: 'Mon-Sat • 9.30am-6.30pm',
                      onTap: () => _launchPhone('+1-800-123-4567'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildContactCard(
                      context,
                      icon: Icons.email,
                      title: 'Email us',
                      subtitle: 'Mon-Sat • 9.30am-6.30pm',
                      onTap: () => _launchEmail('support@agriplus.com'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildContactCard(
                      context,
                      icon: Icons.email,
                      title: 'Email us',
                      subtitle: 'contact@gmail.com',
                      onTap: () => _launchEmail('contact@gmail.com'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Container()),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContactCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green[600],
                ),
                child: Icon(icon, color: Colors.white, size: 28),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
