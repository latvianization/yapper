# ⚡ Yapper

Modern, high-performance team chat, multi-tenant workspaces, and collaboration platform built with **Flutter** (supporting Web, iOS, Android, macOS, Linux, and Windows) with **Zero-Knowledge E2EE**, role-based access control, and a lightweight **REST & Webhook API**.

[![Flutter](https://img.shields.io/badge/Flutter-3.19+-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Platforms](https://img.shields.io/badge/Platforms-Web_|_iOS_|_Android_|_macOS_|_Linux_|_Windows-blueviolet)](#-quickstart)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 Quickstart

### 1. Run the Flutter App
Requires [Flutter SDK](https://flutter.dev) `>= 3.19.0`.

```bash
# Clone & install dependencies
git clone https://github.com/your-org/yapper.git
cd yapper
flutter pub get

# Static analysis & unit/widget tests
flutter analyze
flutter test

# Run on your target platform
flutter run -d chrome     # Web
flutter run -d linux      # Linux desktop
flutter run -d windows    # Windows desktop
flutter run -d macos      # macOS desktop
flutter run -d android    # Android emulator/device
flutter run -d ios        # iOS simulator/device
```

### 2. Build for Web & Production

#### Flutter Web Build
```bash
# Ensure web platform scaffolding exists
flutter create . --platforms web

# Build production release bundle (outputs to build/web/)
flutter build web --release

# Or build with WebAssembly (Wasm) support (Flutter 3.22+)
flutter build web --release --wasm
```

The output in `build/web/` can be deployed directly to Firebase Hosting, Cloudflare Pages, Vercel, or Nginx.

#### Desktop & Mobile Production Targets
```bash
flutter build linux --release      # Linux desktop binary
flutter build windows --release    # Windows desktop binary
flutter build apk --release        # Android APK
```

### 3. Run the Backend REST & Webhook API Server
A lightweight, dependency-free Node.js API server for external bot integrations, automated alerts, and real-time Server-Sent Events (SSE).

```bash
# Start API server (runs on port 3000 by default)
node server/api_server.js

# Test sending an incoming webhook message
bash scripts/send_webhook.sh
```

---

## ⚙️ Configuration & Environment Setup

Below is a breakdown of **where** and **what** configuration must be configured for the project to run in local development and production environments:

### Summary of Configuration Locations

| Target Configuration | Location / File | Purpose |
| :--- | :--- | :--- |
| **Server & Networking** | `.env` or `process.env` | API server port (`PORT`), Client base URL (`API_BASE_URL`). |
| **Client HTTP Client** | [`lib/core/network/api_client.dart`](lib/core/network/api_client.dart) | Base URL and timeouts for Dio HTTP requests. |
| **App Constants & Keys** | [`lib/core/constants/app_constants.dart`](lib/core/constants/app_constants.dart) | Local persistence keys (`SharedPreferences`), default channel roles. |
| **E2EE Cryptography Salt** | [`lib/features/chat/providers/chat_provider.dart`](lib/features/chat/providers/chat_provider.dart) | Salt used in client-side PBKDF2 (100,000 rounds) key derivation. |
| **App Identity & Metadata** | [`pubspec.yaml`](pubspec.yaml) | Package name, app version, build number, asset declarations. |
| **Web Metadata & Icons** | [`web/index.html`](web/index.html), [`web/manifest.json`](web/manifest.json) | Web page `<title>`, PWA theme color, favicon, short name. |
| **Webhook Secrets** | [`server/api_server.js`](server/api_server.js) | Incoming webhook authentication tokens and channel routing. |

---

### What to Configure: Detailed Checklist

#### 1. Environment File (`.env`)
Copy `.env.example` to `.env` to define environment variables:

```bash
cp .env.example .env
```

Configurable variables:
* `PORT`: Port the API server listens on (default: `3000`).
* `API_BASE_URL`: Full URL of the backend API (default: `http://localhost:3000`).
* `E2EE_GLOBAL_SALT`: High-entropy master salt for PBKDF2 key derivation.
* `DEFAULT_WEBHOOK_SECRET`: Pre-shared secret token for incoming bot webhooks.
* `API_BEARER_TOKEN`: Authorization bearer token for secure REST endpoints.
* `SENTRY_DSN`: *(Optional)* Sentry error tracing DSN for crash reporting.
* `FIREBASE_PROJECT_ID`: *(Optional)* Cloud project ID if persisting to cloud instead of local store.

#### 2. E2EE Passphrase & Secrets
* **Where**: [`lib/core/utils/crypto_helper.dart`](lib/core/utils/crypto_helper.dart) and [`lib/features/chat/providers/chat_provider.dart`](lib/features/chat/providers/chat_provider.dart).
* **What**: Zero-knowledge encryption uses AES-GCM 256-bit with PBKDF2 (100k iterations). Ensure each channel uses a distinct salt or passphrase entered by the user.

#### 3. Client API Endpoints
* **Where**: [`lib/core/network/api_client.dart`](lib/core/network/api_client.dart).
* **What**: Modify `baseUrl` to point to your deployed backend domain (e.g. `https://api.yourdomain.com`).

#### 4. Project Identifiers & Bundle ID
* **Flutter Package**: Defined in [`pubspec.yaml`](pubspec.yaml) (`name: yapper`, `version: 1.0.0+1`).
* **Web App Title**: Defined in [`web/index.html`](web/index.html) (`<title>Yapper</title>`) and [`web/manifest.json`](web/manifest.json).
* **Android Bundle ID**: `com.example.yapper` or custom domain (e.g., `com.yourcompany.yapper`) in `android/app/build.gradle`.

---

## 📡 REST & Webhook API Reference

The Yapper backend (`server/api_server.js`) exposes a Discord-compatible REST and Webhook API for external scripts, bots, and services.

### Server Overview
* **Base URL**: `http://localhost:3000`
* **Content-Type**: `application/json`
* **Dependencies**: Zero external npm packages (uses Node.js built-ins).

### Endpoints

#### 1. Health Check
Checks if the API server and real-time streaming are active.

```http
GET /health
```

**Response (`200 OK`)**:
```json
{
  "status": "online",
  "service": "Yapper Webhook & Channel REST API",
  "version": "1.0.0",
  "channelsCount": 6,
  "connectedSSEListeners": 1
}
```

---

#### 2. List Channels
Retrieves all accessible channels.

```http
GET /api/v1/channels
```

**Response (`200 OK`)**:
```json
[
  {
    "id": "general",
    "name": "general",
    "category": "TEXT CHANNELS",
    "type": 0,
    "topic": "Company updates, chatter, and discussion"
  },
  {
    "id": "engineering",
    "name": "engineering",
    "category": "TEXT CHANNELS",
    "type": 0,
    "topic": "Code architecture, deploys, and bug reports"
  }
]
```

---

#### 3. Send Message via Incoming Webhook
Posts a message or Discord-compatible rich embed directly to a channel using a secure token.

```http
POST /api/webhooks/:channelId/:token
```

**Curl Example**:
```bash
curl -X POST "http://localhost:3000/api/webhooks/general/webhook_secret_token_123" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Status Bot",
    "avatar_url": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg",
    "content": "Hello team! Operational status update.",
    "embeds": [
      {
        "title": "System Health",
        "description": "All microservices are operating normally.",
        "color": 3901686,
        "fields": [
          { "name": "Uptime", "value": "99.99%", "inline": true },
          { "name": "Latency", "value": "24ms", "inline": true }
        ],
        "footer": { "text": "Yapper Monitoring API" }
      }
    ]
  }'
```

**Response (`200 OK`)**:
```json
{
  "id": "msg_0f3b49cb-8bb0-4d51-b0e6-81cf69708be9",
  "channelId": "general",
  "senderId": "webhook_bot",
  "senderName": "Status Bot",
  "senderPhotoUrl": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg",
  "isBot": true,
  "text": "Hello team! Operational status update.",
  "embeds": [...],
  "createdAt": "2026-09-03T12:00:00.000Z"
}
```

---

#### 4. Post Channel Message via Bot API
Allows registered bots or automated services to post to any channel by ID.

```http
POST /api/v1/channels/:channelId/messages
```

**Payload**:
```json
{
  "username": "Release Bot",
  "content": "Version 2.4.0 deployed successfully."
}
```

**Response (`201 Created`)**:
```json
{
  "id": "msg_9c9f28a2-d96a-4977-bf30-4e4b6c31bfad",
  "channelId": "engineering",
  "senderName": "Release Bot",
  "text": "Version 2.4.0 deployed successfully."
}
```

---

#### 5. List Channel Messages
Fetches the message history for a given channel.

```http
GET /api/v1/channels/:channelId/messages
```

---

#### 6. Create Channel Webhook
Generates a new incoming webhook endpoint with a cryptographically secure token.

```http
POST /api/v1/channels/:channelId/webhooks
```

**Payload**:
```json
{
  "name": "Billing Alerts"
}
```

**Response (`201 Created`)**:
```json
{
  "id": "wh_4a1b2c3d",
  "channel_id": "general",
  "name": "Billing Alerts",
  "token": "tok_9f8e7d6c5b4a3a2b",
  "url": "http://localhost:3000/api/webhooks/general/tok_9f8e7d6c5b4a3a2b"
}
```

---

#### 7. Real-Time Events Stream (SSE)
Subscribe to live real-time message broadcasts via Server-Sent Events.

```http
GET /api/v1/events
```

```bash
curl -N http://localhost:3000/api/v1/events
```

---

## 🔒 Multi-Tenant Workspaces & Access Control

Yapper supports strict multi-tenancy and role-based access control:

1. **Company Isolation**:
   * Users belonging to Company A can never view, search, or access channels, messages, or metadata belonging to Company B.
   * Workspace header dynamically displays the user's company and role (`👑 Workspace Owner` vs `👥 Team Member`).
2. **Channel Permissions**:
   * **Public Channels**: Visible to all members of that company.
   * **Private / Restricted Channels** (marked with 🔒): Visible exclusively to the **Workspace Owner** and **specifically assigned members**.
3. **Register & Login**:
   * **Register**: Users can either **create a new workspace** (automatically designated as Owner) or **join an existing workspace** (as Member).
   * **Login**: Authenticates email and password, with an in-app **Quick Switch** drawer to easily toggle between test accounts.

---

## ⚡ Shortcuts & Commands

| Slash Command | Action |
| :--- | :--- |
| `/todo item1, item2` | Interactive checklist card |
| `/poll question` | Live multiple-choice poll card |
| `/kudos @user reason` | Celebratory peer recognition card |
| `/shrug [text]` | Appends `¯\_(ツ)_/¯` |

| Keyboard Shortcut | Action |
| :--- | :--- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Command Palette |
| <kbd>Enter</kbd> | Send message |
| <kbd>Shift + Enter</kbd> | Insert newline |

---

## 📁 Repository Structure

```
yapper/
├── .env.example                        # Environment variables template
├── pubspec.yaml                        # Project dependencies & metadata
├── README.md                           # Documentation, setup & API guide
├── AGENTS.md                           # AI assistant guidelines & architecture
├── lib/
│   ├── main.dart                       # App entrypoint
│   ├── app.dart                        # MaterialApp.router with Obsidian Dark theme
│   ├── core/
│   │   ├── constants/                  # Badges, roles, slash commands, storage keys
│   │   ├── network/                    # Dio HTTP client configuration
│   │   ├── router/                     # GoRouter definitions & auth redirection
│   │   ├── theme/                      # Obsidian glassmorphism color palette
│   │   └── utils/                      # AES-GCM 256 + PBKDF2 cipher utilities
│   └── features/
│       ├── auth/
│       │   ├── models/                 # UserModel, CompanyModel
│       │   ├── providers/              # AuthNotifier, multi-tenant persistence
│       │   └── views/                  # LoginScreen, RegisterScreen
│       └── chat/
│           ├── models/                 # ChannelModel, MessageModel
│           ├── providers/              # ChatNotifier, role & company filters
│           └── views/                  # MainLayoutScreen, CommandPalette, Dialogs
├── server/
│   └── api_server.js                   # Webhook & Channel REST API server (zero deps)
├── scripts/
│   └── send_webhook.sh                 # Generic webhook trigger script
└── test/
    ├── auth_and_permissions_test.dart  # Multi-tenancy & access control unit tests
    └── widget_test.dart                # Login & Register UI widget tests
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
