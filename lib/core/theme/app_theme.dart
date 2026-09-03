import 'package:flutter/material.dart';

class AppColors {
  // Obsidian Dark Palette
  static const Color bgMain = Color(0xFF0A0B10);
  static const Color bgSidebar = Color(0xFF0F1118);
  static const Color bgSurface1 = Color(0xFF141722);
  static const Color bgSurface2 = Color(0xFF1B1F2E);
  static const Color bgSurfaceHover = Color(0xFF23293D);
  static const Color bgInput = Color(0xFF121520);

  static const Color borderColor = Color(0x14FFFFFF);
  static const Color borderHighlight = Color(0x29FFFFFF);

  static const Color textMain = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textDim = Color(0xFF64748B);

  // Accents
  static const Color primary = Color(0xFF3B82F6);
  static const Color primaryHover = Color(0xFF2563EB);
  static const Color primaryGlow = Color(0x4D3B82F6);
  static const Color accent = Color(0xFF8B5CF6);
  static const Color accentLight = Color(0xFFA78BFA);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.bgMain,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.bgSurface1,
        error: AppColors.danger,
        onPrimary: Colors.white,
        onSurface: AppColors.textMain,
      ),
      cardTheme: CardThemeData(
        color: AppColors.bgSurface1,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.borderColor),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgInput,
        hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderColor,
        thickness: 1,
        space: 1,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: AppColors.textMain, fontSize: 15),
        bodyMedium: TextStyle(color: AppColors.textMuted, fontSize: 14),
        bodySmall: TextStyle(color: AppColors.textDim, fontSize: 12),
        titleLarge: TextStyle(color: AppColors.textMain, fontWeight: FontWeight.bold, fontSize: 18),
        titleMedium: TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600, fontSize: 15),
      ),
    );
  }
}
