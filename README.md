# ⚡ Yapper — Next-Gen Modern Internal Team Chat

**Yapper** is an ultra-fast, modern, zero-cost internal company chat and events platform built with client-side Vue 3, Firebase Firestore/Storage, and standard native Web APIs (*WebRTC, Web Audio API, Web Speech API, Web Crypto API SubtleCrypto, HTML5 Canvas 2D*).

Designed as an agile, lightweight alternative to bloated enterprise chat tools, Yapper operates entirely in the browser with **zero build steps** and **zero paid dependencies or third-party subscription fees**.

---

## 🏗️ Architecture Overview

```
+------------------------------------------------------------------------------------+
|                                  YAPPER CLIENT                                     |
|  +------------------------------------------------------------------------------+  |
|  |                           Vue 3 (Composition API)                            |  |
|  |  - Reactive State       - Command Palette (⌘K)     - Shimmer Skeleton Feed   |  |
|  |  - Company Events Hub   - Dedicated Event Chat     - Auto Offline Sync Queue |  |
|  |  - Dynamic Action Cards - Obsidian Glassmorphism   - Voice Waveform Player   |  |
|  +------------------------------------------------------------------------------+  |
|         |                   |                     |                    |           |
|         v                   v                     v                    v           |
|  +---------------+  +------------------+  +-------------------+  +---------------+ |
|  | Web Crypto    |  | Native Web       |  |  Web Audio &      |  | HTML5 Canvas  | |
|  | SubtleCrypto  |  | Speech API       |  |  WebRTC Mesh      |  | & Waveforms   | |
|  | (AES-GCM E2EE |  | (Live Voice      |  |  (Huddles, STUN,  |  | (Whiteboard,  | |
|  |  Secret DMs)  |  |  Transcripts)    |  |   Soundboard)     |  |  Video, FX)   | |
|  +---------------+  +------------------+  +-------------------+  +---------------+ |
+---------|-------------------|---------------------|--------------------|-----------+
          |                   |                     |                    |
          +-------------------+---------------------+--------------------+
                                        |
                                        v
                    +-------------------------------------------+
                    |         DATA & REAL-TIME LAYER            |
                    |  - Firebase Firestore (Live Snapshots)    |
                    |  - Firebase Storage (Attachments)         |
                    |  - Local Mock Engine (Offline / Demo)     |
                    +-------------------------------------------+
```

---

## 🌟 Feature Breakdown

### 📅 1. Discord-Style Company Scheduled Events & Event Chat
- **Company Events Hub**: Browse and schedule upcoming team events (*📢 All Hands / Town Hall*, *⚡ Tech Talk / Demo*, *🚀 Product Launch*, *🎉 Social / Game Night*, *🧠 Hackathon / Sprint*, *💬 AMA Session*).
- **Dedicated Event Chat Rooms**: Isolated, real-time event chat rooms (`event_<id>`) for attendees to discuss agenda items, share slide decks, and ask questions before, during, and after events.
- **In-Chat RSVP Cards (`<event-card>`)**: Interactive event announcement cards in channels with real-time attendee counts (`✅ Going`, `⭐️ Interested`) and 1-click **Add to Calendar (.ics)** export.
- **🔴 Live Stage Banner & Voice Huddles**: When an organizer starts an event, a glowing `🔴 LIVE EVENT` banner activates across the workspace with instant drop-in stage voice access.

---

### 🔒 2. Zero-Knowledge E2EE Secret Chat Mode
- **Client-Side AES-GCM 256-bit Encryption**: Uses `window.crypto.subtle` with PBKDF2 key derivation and random initialization vectors (IV).
- **Zero-Knowledge Architecture**: Plaintext is encrypted locally on the sender's browser before transmission to Firestore; even database administrators cannot read message contents.
- **Visual Status & Safety Number**: Displays a gold glowing `🔒 E2EE` padlock badge and includes a cryptographic key fingerprint verification modal.

---

### 🎛️ 3. Custom Voice Memo Waveform Visualizer & Playback Speeds
- **Interactive Canvas Waveform**: Voice notes render interactive peak bars with real-time seek scrubbing.
- **Variable Playback Speeds**: Toggle playback speed with one click through `1.0x` ➔ `1.25x` ➔ `1.5x` ➔ `2.0x`.
- **🗣️ Live Voice-to-Text Transcription**: Native **Web Speech API** integration that automatically transcribes voice memos in real-time as you speak and attaches searchable text transcripts to messages.

---

### 🌟 4. Peer Kudos & Recognition System (`/kudos`)
- **Recognition Badges**: Award badges (`🚀 10x Shipper`, `🐛 Bug Hunter`, `💡 Innovator`, `☕ Coffee Hero`, `🌟 Culture Champion`, `🧠 Brainiac`) with custom appreciation notes.
- **Celebratory In-Chat Cards**: Highlighted appreciation cards with animated icons and sender/recipient attribution.
- **🏆 Company Kudos Leaderboard**: Real-time modal tracking top-recognized teammates and praise counts.

---

### 🎙️ 5. Voice, Video & Audio Communications
- **📹 Quick Video Snippet Recorder**: In-browser webcam recorder with a live preview viewport, 60-second timer, retake functionality, and instant video bubble playback.
- **🎙️ Voice Note Recording**: Inline `MediaRecorder` voice memo tool with live duration counters and dual-tone chime playback.
- **🔊 Live Huddle Soundboard**: Web Audio API synthesized sound effects (*Applause, Tada Fanfare, Success Chime, Drumroll, Buzzer, Victory*) playable in chat or live during huddles without audio asset downloads.
- **🎧 WebRTC Audio Huddles**: Drop-in live voice room per channel using free Google STUN servers (`stun.l.google.com:19302`), speaking pulse animations, and native screen sharing via `getDisplayMedia`.

---

### 🎨 6. Visual Collaboration & Productivity
- **🖌️ Interactive Whiteboard & Diagrammer**: HTML5 `<canvas>` sketchpad with Pen, Arrow, Rectangle, Circle, Eraser, color palette, brush sizing, undo, and 1-click *"Post Diagram to Chat"*.
- **✅ Collaborative Task & Checklist Cards**: Interactive team todo lists with checkable boxes, live progress bars, and completion attribution (*"by Alice"*).
- **📊 Interactive Team Polls**: Real-time multiple-choice poll cards with dynamic percentage bars and voter attribution.
- **⏳ Ephemeral / Self-Destruct Messages**: Timed messages (1m, 5m, 1h, 24h) with pulsing countdown tags and automatic deletion on both client and Firestore upon expiration.
- **🧵 Threaded Replies & Quoting**: Message quoting with clickable quote previews that smoothly scroll and highlight the original message.
- **❤️ Emoji Reactions**: Hover action bar with real-time reaction counters and participant tooltips.
- **📝 Markdown & Code Highlighting**: Client-side parser for code blocks with 1-click copy, inline formatting, blockquotes, and natural `@mentions`.

---

### 🛡️ 7. Governance, Analytics & Offline Resilience
- **🛡️ Workspace Audit Trail**: Admin governance console recording member logins, channel creations, invite dispatches, kudos awards, event starts, and role updates.
- **📊 Channel Activity & Sentiment Analytics**: In-depth analytics modal computing message volume, top contributors, active hour distribution, media breakdown, and client-side team sentiment scoring.
- **💾 Offline Caching & Auto-Sync Queue**: Automatic network monitoring (`navigator.onLine`); messages composed offline queue locally and automatically flush when connectivity is restored.
- **📥 Export Chat History**: 1-click export of any conversation to formatted Markdown (`.md`) or structured JSON (`.json`).
- **🔍 Advanced Search Filters**: In-chat search with keyword filtering and media filters (`has:image`, `has:video`, `has:audio`, `has:event`, `has:file`).

---

## ⚡ Slash Commands Reference

Type these commands directly into any message input box:

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/event` | *None* | Open modal to schedule a new company event with RSVP card |
| `/events` | *None* | Open the Workspace Events Hub directory |
| `/kudos` | `[@user] [reason]` | Open peer recognition modal or award appreciation points |
| `/standup` | *None* | Pre-fills the standard daily async standup format (*Yesterday / Today / Blockers*) |
| `/todo` | `[item1], [item2], ...` | Generates an interactive checklist card with checkable boxes |
| `/remind` | `[minutes] [message]` | Sets a local browser notification alarm timer |
| `/table` | `[cols] [rows]` | Inserts an editable Markdown table template |
| `/poll` | `[question]` | Opens the team poll creation dialog with pre-filled question |
| `/shrug` | `[optional text]` | Appends `¯\_(ツ)_/¯` to your message |
| `/clear` | *None* | Clears active in-chat search and message filters |

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>⌘</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Spotlight-style **Command Palette** |
| <kbd>Enter</kbd> | Send message / Execute active command |
| <kbd>Shift</kbd> + <kbd>Enter</kbd> | Insert new line in message input |
| <kbd>Esc</kbd> | Close active modal, drawer, or Command Palette |

---

## 🛠️ Technology Stack

- **Front-End**: [Vue.js 3](https://vuejs.org/) (Composition API, CDN-distributed)
- **Database & Storage**: [Firebase Firestore](https://firebase.google.com/products/firestore) & [Firebase Storage](https://firebase.google.com/products/storage)
- **Styling**: Modern Obsidian Glassmorphism (`css/style.css`), [FontAwesome 6 Free](https://fontawesome.com/)
- **Typography**: Inter (UI) & JetBrains Mono (Code/Timestamps)
- **Web Standards**:
  - `SubtleCrypto` (Web Crypto API AES-GCM 256-bit E2EE)
  - `RTCPeerConnection` (WebRTC P2P Voice Rooms & Stages)
  - `AudioContext` / `OscillatorNode` (Web Audio API Sound Synthesis)
  - `SpeechRecognition` / `webkitSpeechRecognition` (Web Speech API)
  - `MediaRecorder` & `getUserMedia` (Voice Memos & Video Snippets)
  - `HTMLCanvasElement` 2D Context (Waveforms & Whiteboard Diagramming)
  - `Notification` API (Desktop System Alerts)

---

## 📁 Project Structure

```
yapper/
├── index.html              # Main HTML markup and UI modal definitions
├── manifest.json           # Progressive Web App (PWA) manifest
├── README.md               # Project documentation & reference
├── css/
│   └── style.css           # Obsidian glassmorphism design system & animations
└── js/
    ├── constants.js        # Global constants, Kudos & Event presets, and command config
    ├── utils.js            # Crypto helpers, .ics calendar export, audio synthesizer & parser
    ├── firebase-config.js  # Firebase compat wrapper, Events store, Kudos store & mock engine
    ├── components.js       # Vue 3 UI components (Events, Waveform player, Kudos, etc.)
    └── main.js             # Root Vue 3 app controller, event listeners, and navigation
```

---

## 🚀 Quick Start

### 1. Run Locally
You can run Yapper using any static file server:

```bash
# Python 3
python3 -m http.server 8080 -d /path/to/yapper

# Node.js (npx)
npx serve /path/to/yapper
```

Navigate to `http://localhost:8080` in your browser.

### 2. Instant Demo Mode
If running without a configured Firebase project, click either:
- **"Quick Demo (Founder / Alice)"** — Full Owner/Admin permissions, sample channels (`#general`, `#engineering`, `#design-critique`), sample scheduled All-Hands event, and pre-populated teammates.
- **"Quick Demo (Teammate / Bob)"** — Logs in as Lead Developer member to test multi-user interactions.

### 3. Connect Your Own Firebase Project
To connect to your own live Firebase project:
1. Open [`js/firebase-config.js`](file:///home/andrejs/Desktop/yapper/js/firebase-config.js).
2. Replace `firebaseConfig` with your Firebase Web App credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Enable **Authentication** (Google & Email/Password), **Cloud Firestore**, and **Firebase Storage** in the Firebase Console.
