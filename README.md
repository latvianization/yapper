# ⚡ Yapper

Modern, high-performance team chat and collaboration platform built with **Flutter** (supporting Web, iOS, Android, macOS, Linux, and Windows) and backed by **Firebase** and a **Discord-compatible CI/CD API**.

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

# Run on your target platform
flutter run -d chrome     # Web
flutter run -d linux      # Linux desktop
flutter run -d windows    # Windows desktop
flutter run -d macos      # macOS desktop
flutter run -d android    # Android emulator/device
flutter run -d ios        # iOS simulator/device
```

### 2. Run the Discord-Compatible CI/CD API Server
Allows GitHub Actions, GitLab CI, or Jenkins to post build alerts directly to Yapper channels.

```bash
# Start webhook server (port 3000, zero dependencies)
node server/api_server.js

# Test sending a build notification
bash scripts/ci_webhook_demo.sh success
```

---

## 🌟 Core Features

* **🤖 Discord Channels & CI Webhooks**: Collapsible channel categories (`ANNOUNCEMENTS`, `TEXT`, `CI & ALERTS`, `VOICE`) with Discord-compatible webhook endpoints (`POST /api/webhooks/:channelId/:token`) and rich embed cards.
* **🔒 Zero-Knowledge E2EE**: Client-side AES-GCM 256-bit encryption with PBKDF2 (100k rounds) and safety fingerprints.
* **🔔 Intelligent Push Notifications**: Automatically suppresses alerts if you are actively viewing the chat; dispatches cross-platform push notifications if you are in another channel or backgrounded.
* **🎙️ Voice Memo Waveforms**: Interactive peak-bar audio scrubber with `1x` to `2x` variable speeds.
* **🎨 Collaborative Whiteboard**: 120Hz canvas sketchpad with stroke colors, undo, and one-click post to chat.
* **⌨️ Command Palette (`⌘K` / `Ctrl+K`)**: Spotlight-style switcher for channels, slash commands, and search.
* **📦 Interactive Cards**: `/todo` checklists, `/poll` live voting, and `/kudos` peer recognition.

---

## 🤖 CI/CD Webhook Integration (GitHub Actions)

Add this step to `.github/workflows/ci.yml` to receive automated build status cards in `#ci-builds`:

```yaml
- name: Notify Yapper Channel
  if: always()
  run: |
    STATUS="${{ job.status }}"
    COLOR=$([ "$STATUS" = "success" ] && echo 65280 || echo 16711680)

    curl -s -X POST "http://localhost:3000/api/webhooks/ci-builds/ci_token_secret_12345" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "GitHub Actions",
        "content": "**Build '${{ github.run_number }}'** on `'"${{ github.ref_name }}"'` finished: **'"$STATUS"'**",
        "embeds": [{
          "title": "CI/CD Pipeline: '"$STATUS"'",
          "color": '"$COLOR"',
          "fields": [
            { "name": "Branch", "value": "`'"${{ github.ref_name }}"'`", "inline": true },
            { "name": "Commit", "value": "`'"${{ github.sha }}"'`", "inline": true }
          ]
        }]
      }'
```

---

## 💰 Firebase Cost & Usage

| Tier / Scenario | Active Users | Monthly Messages | Estimated Cost | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Spark (Free)** | **25 – 50 DAUs** | ~400,000 | **`$0.00 / mo`** | 50k reads/day, 20k writes/day, 1 GB storage |
| **Blaze (Startup)** | **100 DAUs** | ~750,000 | **`~$3.29 / mo`** | Pay-as-you-go over free daily quotas |
| **Blaze (Mid-Sized)** | **500 DAUs** | ~4,500,000 | **`~$39.99 / mo`** | >99% savings vs Slack Pro ($4,375/mo) |

---

## ⚡ Shortcuts & Commands

| Slash Command | Action |
| :--- | :--- |
| `/todo item1, item2` | Interactive checklist card |
| `/poll question` | Live multiple-choice poll card |
| `/kudos @user reason` | Celebratory recognition card |
| `/shrug [text]` | Appends `¯\_(ツ)_/¯` |

| Keyboard Shortcut | Action |
| :--- | :--- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Command Palette |
| <kbd>Enter</kbd> | Send message |
| <kbd>Shift + Enter</kbd> | Newline |

---

## 📁 Repository Structure

* [`lib/`](file:///home/andrejs/Desktop/yapper/lib/): Flutter application (Riverpod state, GoRouter navigation, Obsidian Dark theme).
* [`server/api_server.js`](file:///home/andrejs/Desktop/yapper/server/api_server.js): Discord-compatible CI/CD Webhooks & Channel REST API server.
* [`scripts/ci_webhook_demo.sh`](file:///home/andrejs/Desktop/yapper/scripts/ci_webhook_demo.sh): CI webhook test & simulation script.
* [`AGENTS.md`](file:///home/andrejs/Desktop/yapper/AGENTS.md): High-density architecture context and coding rules for AI assistants.
* [`js/`](file:///home/andrejs/Desktop/yapper/js/), [`index.html`](file:///home/andrejs/Desktop/yapper/index.html): Preserved legacy client-side Vue 3 prototype.

---

## 📄 License

Distributed under the [MIT License](file:///home/andrejs/Desktop/yapper/LICENSE).
