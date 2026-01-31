import 'package:flutter/material.dart';

class AppColors {
  static const Color primaryGreen = Color(0xFF059669);
  static const Color darkGreen = Color(0xFF047857);
  static const Color lightGreen = Color(0xFF10B981);
  static const Color emerald = Color(0xFF34D399);
  static const Color mint = Color(0xFF6EE7B7);
  
  static const Color accentTeal = Color(0xFF14B8A6);
  static const Color accentPurple = Color(0xFF9D4EDD);
  static const Color accentPink = Color(0xFFFF6B9D);
  static const Color accentOrange = Color(0xFFFF6F3D);
  static const Color accentBlue = Color(0xFF4CC9F0);
  
  static const Color primaryBlue = primaryGreen;
  static const Color primaryPurple = darkGreen;
  static const Color primaryPink = accentPink;
  static const Color primaryOrange = accentOrange;
  static const Color primaryCyan = accentTeal;
  static const Color accentViolet = accentPurple;
  static const Color accentRose = accentPink;
  static const Color accentEmerald = emerald;
  static const Color accentSky = accentBlue;
  static const Color accentAmber = accentOrange;
  
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color backgroundDark = Color(0xFF0F0F0F);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF1C1C1E);
  
  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF14B8A6);
  
  static const Color textPrimary = Color(0xFF18181B);
  static const Color textSecondary = Color(0xFF52525B);
  static const Color textMuted = Color(0xFFA1A1AA);
  static const Color textLight = Color(0xFFFFFFFF);
  
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF14B8A6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient sunsetGradient = LinearGradient(
    colors: [Color(0xFFFF6F3D), Color(0xFFFF6B9D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient purpleGradient = LinearGradient(
    colors: [Color(0xFF9D4EDD), Color(0xFF7B2CBF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient blueGradient = LinearGradient(
    colors: [Color(0xFF4CC9F0), Color(0xFF4361EE)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient cyanGradient = LinearGradient(
    colors: [Color(0xFF14B8A6), Color(0xFF059669)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient darkGradient = LinearGradient(
    colors: [Color(0xFF0F0F0F), Color(0xFF1C1C1E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFAFAFA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient glassGradient = LinearGradient(
    colors: [
      Color(0x40FFFFFF),
      Color(0x20FFFFFF),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFEC4899), Color(0xFF8B5CF6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static BoxShadow primaryShadow = BoxShadow(
    color: primaryGreen.withOpacity(0.25),
    blurRadius: 20,
    offset: const Offset(0, 8),
    spreadRadius: -4,
  );
  
  static BoxShadow cardShadow = BoxShadow(
    color: Colors.black.withOpacity(0.08),
    blurRadius: 24,
    offset: const Offset(0, 4),
    spreadRadius: -2,
  );
  
  static BoxShadow softShadow = BoxShadow(
    color: Colors.black.withOpacity(0.05),
    blurRadius: 12,
    offset: const Offset(0, 2),
    spreadRadius: -1,
  );
  
  static BoxShadow glowShadow = BoxShadow(
    color: primaryGreen.withOpacity(0.4),
    blurRadius: 32,
    offset: const Offset(0, 8),
    spreadRadius: -8,
  );
  
  static BoxShadow colorfulShadow(Color color) {
    return BoxShadow(
      color: color.withOpacity(0.35),
      blurRadius: 24,
      offset: const Offset(0, 10),
      spreadRadius: -4,
    );
  }
}
