# Yapper — Agent Developer Context & Guidelines

> **Target Audience**: AI Coding Assistants & Human Engineers  
> **Purpose**: High-density context for zero-overhead task execution and token efficiency.

---

## 1. Project Overview & Tech Stack

**Yapper** is a next-generation real-time team chat, events hub, and collaboration platform. Originally built in client-side Vue 3, it has been migrated to a production-grade, multiplatform **Flutter** application supporting **Web, iOS, Android, macOS, Linux, and Windows**.

* **Language & SDK**: Dart 3.3+ / Flutter 3.19+
* **State Management**: `flutter_riverpod: ^2.5.1` (`StateNotifier` / `StateNotifierProvider`)
* **Routing & Navigation**: `go_router: ^14.2.0` (Declarative, web URL sync, shell layout)
* **Networking**: `dio: ^5.4.3+1` (Interceptors, retry, bearer token authorization)
* **Local Persistence**: `shared_preferences: ^2.2.3` (Local user cache, theme settings)
* **Cryptography**: `cryptography: ^2.7.0` (Zero-knowledge AES-GCM 256-bit, PBKDF2 100k iterations)
* **Typography & Icons**: `lucide_icons: ^0.257.0`, Material 3 design system
* **Markdown**: `flutter_markdown: ^0.7.2`

---

## 2. Directory Layout

```
yapper/
├── pubspec.yaml                        # Project metadata & dependencies
├── analysis_options.yaml               # Linter configuration (flutter_lints)
├── AGENTS.md                           # This context file (loaded by Antigravity)
├── GEMINI.md                           # Symlink/mirror for Antigravity rules
├── README.md                           # End-user setup, build steps & architecture
├── lib/
│   ├── main.dart                       # App entrypoint (WidgetsFlutterBinding + ProviderScope)
│   ├── app.dart                        # MaterialApp.router with Obsidian Dark theme
│   ├── core/
│   │   ├── constants/
│   │   │   └── app_constants.dart      # Badges, roles, slash commands, status options, emojis
│   │   ├── network/
│   │   │   └── api_client.dart         # Dio HTTP client configuration
│   │   ├── router/
│   │   │   └── app_router.dart         # GoRouter definitions
│   │   ├── theme/
│   │   │   └── app_theme.dart          # Obsidian glassmorphism color palette & ThemeData
│   │   └── utils/
│   │       ├── crypto_helper.dart      # AES-GCM 256 + PBKDF2 E2EE cipher utility
│   │       └── formatters.dart         # Time, date, duration, file size, initials
│   └── features/
│       ├── auth/
│       │   ├── models/user_model.dart
│       │   └── providers/auth_provider.dart
│       ├── chat/
│       │   ├── models/
│       │   │   ├── channel_model.dart
│       │   │   └── message_model.dart
│       │   ├── providers/chat_provider.dart
│       │   ├── widgets/
│       │   │   ├── user_avatar.dart
│       │   │   ├── message_bubble.dart
│       │   │   ├── custom_audio_player.dart  # Interactive waveform & 1x-2x playback
│       │   │   ├── chat_input_bar.dart       # Slash commands (/todo, /poll, /shrug) & E2EE
│       │   │   ├── task_checklist_card.dart  # Interactive checklist card
│       │   │   ├── poll_card.dart            # Live voting percentage bars
│       │   │   ├── kudos_card.dart           # Celebratory recognition card
│       │   │   ├── event_card.dart           # Event card with RSVP
│       │   │   └── whiteboard_dialog.dart    # Canvas 2D sketchpad (CustomPainter)
│       │   └── views/
│       │       ├── command_palette_dialog.dart # ⌘K / Ctrl+K quick switcher
│       │       └── main_layout_screen.dart   # Responsive desktop sidebar / mobile drawer
│       └── events/
│           ├── models/event_model.dart
│           └── views/events_hub_dialog.dart  # Company Events Hub directory
└── js/, css/, index.html               # Legacy Vue 3 web prototype (preserved)
```

---

## 3. Essential Commands

```bash
# Install dependencies
flutter pub get

# Static analysis & formatting
flutter analyze
dart format --set-exit-if-changed lib/

# Run tests
flutter test

# Run application by platform
flutter run -d chrome     # Web
flutter run -d linux      # Linux desktop
flutter run -d windows    # Windows desktop
flutter run -d macos      # macOS desktop
flutter run -d ios        # iOS simulator
flutter run -d android    # Android emulator

# Production compilation
flutter build web --release --wasm
flutter build linux --release
flutter build windows --release
flutter build apk --release
```

---

## 4. Key Conventions & Architecture Rules

1. **State Immutability**:
   * Never mutate lists, maps, or model fields directly.
   * Always use `state = state.copyWith(...)` inside `StateNotifier`.
2. **Provider Selectivity**:
   * Avoid calling `ref.watch(chatProvider)` in leaf widgets.
   * Prefer `ref.watch(chatProvider.select((s) => s.activeChannel))` to limit rebuild boundaries.
3. **Responsive Breakpoints**:
   * Use `MediaQuery.of(context).size.width >= 800` (or `LayoutBuilder`) to toggle between Desktop Sidebar and Mobile Bottom Sheet / Drawer.
4. **Clean Disposal**:
   * Always dispose `TextEditingController`, `ScrollController`, and `FocusNode` in `dispose()`.
5. **Multiplatform Safe**:
   * Avoid platform-specific `dart:io` or `dart:html` imports directly in shared feature files. Use cross-platform packages (`cryptography`, `shared_preferences`, `dio`).
6. **Query & Cost Efficiency**:
   * Always paginate chat queries (e.g. `limitToLast(50)`) to maintain free tier eligibility (50k reads/day). Cache channel metadata locally.

