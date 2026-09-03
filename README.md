# ⚡ Yapper — Next-Gen Modern Team Chat & Collaboration Platform

[![Flutter](https://img.shields.io/badge/Flutter-3.19+-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.3+-0175C2?logo=dart&logoColor=white)](https://dart.dev)
[![Riverpod](https://img.shields.io/badge/State-Riverpod_2.5+-40C4FF)](https://riverpod.dev)
[![Platforms](https://img.shields.io/badge/Platforms-Web_|_iOS_|_Android_|_macOS_|_Linux_|_Windows-blueviolet)](#-multiplatform-build-guide)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Yapper** is a high-performance, real-time internal company chat and events platform featuring **Zero-Knowledge End-to-End Encryption (E2EE)**, interactive waveform voice memos, collaborative whiteboard sketching, Discord-style company event hubs, and dynamic in-chat action cards.

Originally developed as a lightweight client-side Vue 3 application, Yapper has been migrated into a unified **Multiplatform Flutter codebase** supporting **Web, iOS, Android, macOS, Linux, and Windows** from a single shared code repository.

---

## 🏗️ Architecture Overview

```
                                  +---------------------------------------+
                                  |              YAPPER APP               |
                                  |    (Flutter 3.19+ / Dart 3.3+)        |
                                  +---------------------------------------+
                                                     |
         +--------------------+----------------------+---------------------+--------------------+
         |                    |                      |                     |                    |
         v                    v                      v                     v                    v
  +--------------+     +--------------+       +--------------+      +--------------+     +--------------+
  | Presentation |     |  State & VM  |       |   Security   |      |  Navigation  |     |  Networking  |
  |  (Widgets)   |     |  (Riverpod)  |       | (E2EE/Crypto)|      |  (GoRouter)  |     |    (Dio)     |
  +--------------+     +--------------+       +--------------+      +--------------+     +--------------+
  | - Responsive |     | - ChatNotifier       | - AES-GCM 256|      | - Web URLs   |     | - Interceptor|
  |   Scaffold   |     | - AuthNotifier       | - PBKDF2 100k|      | - Deep links |     | - Bearer Auth|
  | - Canvas 2D  |     | - Selectors          | - SHA256     |      | - Desktop    |     | - Offline    |
  |   Sketchpad  |     | - StateNotifier      |   Fingerprint|      |   ShellRoute |     |   Queue      |
  | - Waveform   |     +--------------+       +--------------+      +--------------+     +--------------+
  |   Audio      |            |                      |                     |                    |
  +--------------+            +----------------------+---------------------+--------------------+
         |                                           |
         v                                           v
+-----------------------------------------------------------------------------------------------+
|                      TARGET PLATFORMS (100% Shared UI & Logic)                                 |
|         🌐 Web (WASM/CanvasKit)  •  🍏 iOS  •  🤖 Android  •  🐧 Linux  •  🪟 Windows  •  🍎 macOS     |
+-----------------------------------------------------------------------------------------------+
```

---

## 🌟 Key Features

1. **Zero-Knowledge E2EE Secret Chat**:
   - AES-GCM 256-bit encryption with PBKDF2 key derivation (100,000 rounds).
   - Messages are encrypted locally on-device before transmission; includes safety fingerprint verification.
2. **Interactive Audio Waveforms**:
   - Visual peak bar representation with tap-to-seek scrubbing.
   - Variable playback speeds (`1.0x` ➔ `1.25x` ➔ `1.5x` ➔ `2.0x`).
3. **Collaborative Whiteboard**:
   - Hardware-accelerated 2D drawing canvas with stroke color palette, brush sizing, undo, and one-click "Post to Chat".
4. **Discord-Style Events Hub & Cards**:
   - Scheduled company town halls, tech talks, and hackathons with real-time RSVPs (`Going`, `Interested`).
5. **Interactive In-Chat Action Cards**:
   - Checkable task checklists (`/todo`) with live progress bars.
   - Real-time team polls (`/poll`) with dynamic percentage distribution.
   - Celebratory peer kudos cards (`/kudos`).
6. **Command Palette (`⌘K` / `Ctrl+K`)**:
   - Spotlight-style keyboard launcher for jumping to channels, running slash commands, or scheduling events.
7. **Intelligent Push Notifications**:
   - **Context-Aware Suppression**: If the user is actively viewing the chat where the new message arrives, notifications are automatically suppressed.
   - **Multiplatform Dispatch**: If the user is viewing another channel or the app is minimized/backgrounded, push notifications are dispatched to all channels (browsers, mobile apps, desktop centers).
   - **Direct Channel Routing**: Clicking a notification auto-focuses the window and jumps straight into that conversation.


---

## 🚀 Multiplatform Build Guide

### Prerequisites

* [Flutter SDK](https://docs.flutter.dev/get-started/install) (`>= 3.19.0`)
* [Dart SDK](https://dart.dev/get-dart) (`>= 3.3.0`)
* Platform tools (depending on target):
  * **Web**: Google Chrome or any modern Chromium browser.
  * **Linux**: `clang`, `cmake`, `ninja-build`, `pkg-config`, `libgtk-3-dev`.
  * **Windows**: Visual Studio 2022 with "Desktop development with C++".
  * **macOS / iOS**: Xcode 15+.
  * **Android**: Android Studio & Android SDK / command-line tools.

---

### Step 1: Install Dependencies

Clone the repository and fetch packages:

```bash
git clone https://github.com/your-org/yapper.git
cd yapper
flutter pub get
```

Verify setup:
```bash
flutter doctor
```

---

### Step 2: Run in Development Mode

Run directly on your connected device or simulator:

```bash
# Web (Chrome)
flutter run -d chrome

# Linux Desktop
flutter run -d linux

# Windows Desktop
flutter run -d windows

# macOS Desktop
flutter run -d macos

# Android (Emulator / USB Device)
flutter run -d android

# iOS (Simulator / Device)
flutter run -d ios
```

---

### Step 3: Production Build

Compile optimized release binaries:

```bash
# Web (High-performance WebAssembly compilation)
flutter build web --release --wasm

# Linux Desktop (.tar.gz bundle / executable)
flutter build linux --release

# Windows Desktop (.exe executable)
flutter build windows --release

# Android APK / App Bundle
flutter build apk --release
flutter build appbundle --release

# iOS Bundle (Requires macOS)
flutter build ipa --release
```

---

## ⚙️ Configuration & Customization

### Backend API Configuration
The HTTP client is located at [`lib/core/network/api_client.dart`](file:///home/andrejs/Desktop/yapper/lib/core/network/api_client.dart).  
To configure the base API endpoint or pass an authentication token:

```dart
final client = ApiClient(
  baseUrl: 'https://api.yourcompany.com/v1',
  authToken: 'YOUR_SESSION_BEARER_TOKEN',
);
```

### Design Tokens & Theming
Theme tokens are configured in [`lib/core/theme/app_theme.dart`](file:///home/andrejs/Desktop/yapper/lib/core/theme/app_theme.dart):
* `AppColors.bgMain` (`#0A0B10`): Deep obsidian root canvas
* `AppColors.bgSurface1` (`#141722`): Elevated cards and modals
* `AppColors.primary` (`#3B82F6`): Vibrant action blue
* `AppColors.accent` (`#8B5CF6`): Electric violet highlight

### Cryptographic Configuration
E2EE key derivation and cipher settings can be tuned in [`lib/core/utils/crypto_helper.dart`](file:///home/andrejs/Desktop/yapper/lib/core/utils/crypto_helper.dart):
* Cipher: `AesGcm.with256bits()`
* Key derivation: `Pbkdf2(macAlgorithm: Hmac.sha256(), iterations: 100000, bits: 256)`

---

## 💰 Firebase Usage & Cost Breakdown

Yapper is architected to take maximum advantage of Firebase's generous **Spark (Free)** tier and the ultra-low unit economics of the **Blaze (Pay-as-you-go)** plan.

### 1. User Action to Firebase Operation Mapping

Every interaction in Yapper maps directly to predictable Firebase operations:

| User / Team Action | Firestore Operations | Storage / Network |
| :--- | :--- | :--- |
| **Send Message** (`text`, `markdown`, `/shrug`) | **1 write** (`messages` collection) | Negligible (~1 KB) |
| **Real-Time Message Receive** (Live Snapshot) | **1 read** per active online subscriber in the channel | Negligible |
| **Add / Toggle Emoji Reaction** | **1 write** (`messages/{id}` update) | 0 B |
| **Vote on Poll / Check Task List** | **1 write** (`messages/{id}` update) | 0 B |
| **User Login / Session Start** | **1 read** (`users/{uid}` document) | Firebase Auth is **Free** |
| **Switch Channel / Open App** | **30 to 50 reads** (initial `limitToLast(50)` query) | ~50 KB payload |
| **Upload Voice Memo / Image** | **1 write** (metadata doc) + **1 Storage write** | File size (e.g. 300 KB–2 MB) |
| **WebRTC Voice Huddle** | **0 writes / 0 reads** (P2P mesh via Google STUN) | **Free** (0 egress cost) |

---

### 2. What Fits 100% Free on the Spark Tier ($0.00 / month)

Firebase offers daily recurring free quotas on the **Spark Plan** without requiring a credit card:

| Firebase Service | Daily Free Quota | Monthly Equivalent | Yapper Real-World Capacity |
| :--- | :--- | :--- | :--- |
| **Firestore Document Writes** | 20,000 writes / day | **600,000 writes / mo** | ~10,000–15,000 messages & reactions / day |
| **Firestore Document Reads** | 50,000 reads / day | **1,500,000 reads / mo** | ~35,000–45,000 live delivers + channel loads / day |
| **Firestore Document Deletes**| 20,000 deletes / day | **600,000 deletes / mo** | Automated ephemeral message cleanups |
| **Firestore Data Storage** | 1 GiB total | **1 GiB** | **~1,000,000 text messages** (~1 KB/doc) |
| **Cloud Storage (Attachments)**| 5 GiB total | **5 GiB** | **~10,000 voice memos** or **~2,500 photos** |
| **Cloud Storage Bandwidth** | 1 GiB / day | **30 GiB / mo** | ~30,000 voice memo streams / mo |
| **Firebase Authentication** | Unlimited | **50,000 MAUs** | Email/password, Google Sign-in |
| **Push Notifications (FCM)** | Unlimited | **Unlimited** | Real-time desktop & mobile notifications |

> [!TIP]
> **Free Tier Team Size**: A company or team of **25 to 50 active daily users** chatting, sending voice memos, reacting, and conducting daily standups full-time will typically spend **$0.00 / month**.

---

### 3. Scaling Beyond Free Limits (Blaze Pay-As-You-Go Plan)

Once your workspace exceeds the Spark quotas, billing on the Blaze plan is based strictly on consumption. The free daily allowances continue to apply every single day:

* **Additional Document Reads**: **$0.06** per 100,000 reads ($0.0006 per 1k)
* **Additional Document Writes**: **$0.18** per 100,000 writes ($0.0018 per 1k)
* **Additional Document Deletes**: **$0.02** per 100,000 deletes
* **Database Storage**: **$0.18** / GiB / month (first 1 GiB free)
* **Attachment Storage**: **$0.026** / GiB / month (first 5 GiB free)
* **Network Egress**: **$0.12** / GiB (first 10 GiB/month free)

---

### 4. Real-World Scaling Cost Scenarios

Here is how monthly bills calculate across three distinct organizational sizes:

#### 🟢 Scenario A: Fast-Growing Startup (100 Daily Active Users)
* **Activity**: 25,000 messages + reactions/day (750k/month); 150,000 reads/day (4.5M/month); 15 GB attachments.
* **Writes**: $(750,000 - 600,000 \text{ free}) \times \frac{\$0.18}{100,000} = \mathbf{\$0.27}$
* **Reads**: $(4,500,000 - 1,500,000 \text{ free}) \times \frac{\$0.06}{100,000} = \mathbf{\$1.80}$
* **Storage**: 3 GB DB (2 GB billable = $\$0.36$) + 15 GB attachments (10 GB billable = $\$0.26$) = $\mathbf{\$0.62}$
* **Egress**: 15 GB total (5 GB billable $\times \$0.12$) = $\mathbf{\$0.60}$
* **Total Estimated Cost**: **`~$3.29 / month`**

---

#### 🟡 Scenario B: Mid-Sized Company (500 Daily Active Users)
* **Activity**: 150,000 messages + reactions/day (4.5M/month); 1,200,000 reads/day (36M/month); 80 GB attachments.
* **Writes**: $(4,500,000 - 600,000 \text{ free}) \times \frac{\$0.18}{100,000} = \mathbf{\$7.02}$
* **Reads**: $(36,000,000 - 1,500,000 \text{ free}) \times \frac{\$0.06}{100,000} = \mathbf{\$20.70}$
* **Storage**: 15 GB DB (14 GB billable = $\$2.52$) + 80 GB attachments (75 GB billable = $\$1.95$) = $\mathbf{\$4.47}$
* **Egress**: ~75 GB total (65 GB billable $\times \$0.12$) = $\mathbf{\$7.80}$
* **Total Estimated Cost**: **`~$39.99 / month`**
* **SaaS Comparison**: 500 seats on Slack Pro ($8.75/user/month) = **$4,375.00 / month**. Yapper saves over **99.1%** in software expenditure.

---

#### 🟣 Scenario C: Large Organization (2,500 Daily Active Users)
* **Activity**: 1,000,000 messages/day (30M/month); 7,500,000 reads/day (225M/month); 400 GB attachments.
* **Writes**: $(30,000,000 - 600,000) \times \frac{\$0.18}{100,000} = \mathbf{\$52.92}$
* **Reads**: $(225,000,000 - 1,500,000) \times \frac{\$0.06}{100,000} = \mathbf{\$134.10}$
* **Storage**: 60 GB DB (59 GB billable = $\$10.62$) + 400 GB files (395 GB billable = $\$10.27$) = $\mathbf{\$20.89}$
* **Egress**: ~350 GB total (340 GB billable $\times \$0.12$) = $\mathbf{\$40.80}$
* **Total Estimated Cost**: **`~$248.71 / month`**
* **SaaS Comparison**: 2,500 seats on Slack Pro = **$21,875.00 / month**.

---

### 5. Architectural Optimizations Keeping Costs Low

Yapper’s client architecture incorporates several techniques to minimize billable operations:
1. **Windowed Snapshot Queries**: Messages query with `limitToLast(50)`, fetching older history only on upward scroll.
2. **Local Client Caching**: Channels and user profile metadata are cached locally via `shared_preferences`, avoiding duplicate reads on app relaunch.
3. **P2P WebRTC Huddles**: Live voice audio streams peer-to-peer via free STUN (`stun.l.google.com:19302`), requiring zero database reads, writes, or media server costs.
4. **Zero-Knowledge E2EE Overhead**: Encrypted payloads are stored in the same message document, introducing zero extra document reads or writes.
5. **Ephemeral Auto-Purge**: Expired self-destruct messages purge automatically, keeping database storage compact within the free 1 GiB quota.

---

## ⚡ Slash Commands Reference

Type these commands directly into the message input box:

| Command | Syntax | Output |
| :--- | :--- | :--- |
| `/todo` | `/todo Setup CI, Write tests, Deploy` | Interactive checkable task list card with progress bar |
| `/poll` | `/poll Should we deploy on Friday?` | Dynamic voting card with option percentage bars |
| `/kudos`| `/kudos @teammate Great work on migration` | Celebratory peer recognition card |
| `/shrug`| `/shrug [text]` | Appends `¯\_(ツ)_/¯` to text |
| `/event`| `/event` | Opens the event scheduling modal |

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>⌘</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Spotlight-style **Command Palette** |
| <kbd>Enter</kbd> | Send message / Execute active command |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Insert new line in message input |
| <kbd>Esc</kbd> | Close active dialog or drawer |

---

## 🤖 AI Assistant / Antigravity Agent Guidelines

To save tokens and provide instant context on every assistant invocation, this repository includes:
* **[`AGENTS.md`](file:///home/andrejs/Desktop/yapper/AGENTS.md)**: High-density project summary, directory guide, key conventions, and commands.
* **[`GEMINI.md`](file:///home/andrejs/Desktop/yapper/GEMINI.md)**: Top-level rule context file discovered automatically by Antigravity agents.
* **[`.agents/rules/flutter_guidelines.md`](file:///home/andrejs/Desktop/yapper/.agents/rules/flutter_guidelines.md)**: Granular state management, styling, and multiplatform rules.

---

## 🌐 Legacy Vue 3 Web Prototype

The zero-build client-side Vue 3 prototype is preserved for reference:
* Start static server: `python3 -m http.server 8080`
* Open `http://localhost:8080` in your browser.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](file:///home/andrejs/Desktop/yapper/LICENSE) for more details.
