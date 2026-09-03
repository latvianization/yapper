# Yapper — Workspace Context & Instructions

This repository contains **Yapper**, a modern real-time team chat, events hub, and collaboration platform migrated from client-side Vue 3 to **Flutter (Dart)** with full multiplatform support (Web, iOS, Android, macOS, Linux, and Windows).

Refer to [AGENTS.md](file:///home/andrejs/Desktop/yapper/AGENTS.md) for detailed architecture, directory layout, conventions, and cheat sheets.

### Core Stack:
- **Framework**: Flutter 3.19+ (Dart 3.3+)
- **State**: `flutter_riverpod: ^2.5.1` (`StateNotifierProvider`)
- **Navigation**: `go_router: ^14.2.0`
- **Network**: `dio: ^5.4.3+1`
- **Security / E2EE**: `cryptography: ^2.7.0` (AES-GCM 256, PBKDF2)
- **Theme**: Obsidian Glassmorphism (`lib/core/theme/app_theme.dart`)

### Commands:
- `flutter pub get` — Fetch packages
- `flutter analyze` — Run static analysis
- `flutter run -d chrome|linux|windows|macos|ios|android` — Run application
