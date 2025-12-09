import 'package:flutter/material.dart';

class AppColors {
  static const Color primaryGreen = Color(0xFF16A34A);
  static const Color darkGreen = Color(0xFF15803D);
  static const Color lightGreen = Color(0xFF22C55E);
  static const Color emerald = Color(0xFF10B981);
  static const Color mint = Color(0xFF6EE7B7);
  
  static const Color accentTeal = Color(0xFF14B8A6);
  static const Color accentLime = Color(0xFF84CC16);
  
  static const Color backgroundLight = Color(0xFFF0FDF4);
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF1E293B);
  
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
  
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textLight = Color(0xFFFFFFFF);
  
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF16A34A), Color(0xFF10B981)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient darkGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFDCFCE7), Color(0xFFF0FDF4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFF22C55E), Color(0xFF14B8A6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static BoxShadow primaryShadow = BoxShadow(
    color: primaryGreen.withOpacity(0.3),
    blurRadius: 12,
    offset: const Offset(0, 4),
  );
  
  static BoxShadow cardShadow = BoxShadow(
    color: Colors.black.withOpacity(0.08),
    blurRadius: 16,
    offset: const Offset(0, 4),
  );
}
