# Flutter Architecture & Coding Guidelines for Yapper

When writing or refactoring Flutter code in this repository:

1. **State Management**:
   - Use `flutter_riverpod`.
   - Keep business logic in `StateNotifier` or `Notifier` classes under `features/<feature>/providers/`.
   - Never mutate state objects directly; use immutable copies (`state = state.copyWith(...)`).
   - Use `ref.watch(provider.select(...))` in UI build methods to minimize rebuild tree depth.

2. **Styling & Design System**:
   - Use color tokens from `AppColors` (`lib/core/theme/app_theme.dart`).
   - Maintain the Obsidian Dark theme aesthetic (dark neutral surfaces `#0A0B10`, `#141722`, border highlights, `#3B82F6` primary accent).

3. **Navigation**:
   - Use `GoRouter` declared in `lib/core/router/app_router.dart`.
   - Avoid hardcoding navigation logic that breaks URL sync on Web or deep links on Mobile.

4. **Multiplatform Safety**:
   - Ensure all components compile cleanly on Web, Windows, Linux, macOS, iOS, and Android.
   - Do not import `dart:html` or `dart:io` in shared libraries; use platform-agnostic abstractions or packages (`cryptography`, `dio`, `shared_preferences`).
