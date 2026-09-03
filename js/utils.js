// Utility functions for Yapper

const utils = {
  // Generate random IDs with prefix
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  // Safe HTML character escaping to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Format timestamp into human-readable string
  formatTime(timestamp) {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // Format full event date and time
  formatEventDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // Format recording duration
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },

  // Format file size in bytes to KB/MB
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Get file category from File object or MIME string
  getFileCategory(file) {
    const type = file.type || '';
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'file';
  },

  // Read File as Data URL (base64 fallback for free tier)
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // Lightweight & Secure Client-Side Markdown Parser
  parseMarkdown(rawText) {
    if (!rawText) return '';
    let html = this.escapeHtml(rawText);

    // Multi-line code blocks with syntax block styling & safe inner copy
    html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="code-block-wrap"><div class="code-block-header"><span>${lang || 'code'}</span><button class="code-copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrap').querySelector('code').innerText); window.YapperApp?.showToast('Code copied to clipboard!', 'info')"><i class="fa-regular fa-copy"></i> Copy</button></div><pre><code>${code.trim()}</code></pre></div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Blockquotes
    html = html.replace(/^&gt;\s*(.+)$/gm, '<blockquote class="chat-quote">$1</blockquote>');

    // URLs to safe clickable links
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');

    // @mentions highlighting
    html = html.replace(/@([a-zA-Z0-9_.-]+)/g, '<span class="mention-pill">@$1</span>');

    // Line breaks to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  // Get user avatar initials
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  // Color generator for avatar background
  getAvatarGradient(str) {
    if (!str) return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      'linear-gradient(135deg, #ec4899, #be185d)',
      'linear-gradient(135deg, #10b981, #047857)',
      'linear-gradient(135deg, #f59e0b, #b45309)',
      'linear-gradient(135deg, #06b6d4, #0e7490)'
    ];
    return colors[Math.abs(hash) % colors.length];
  },

  // ── Web Speech Recognition API (Voice-to-Text) ──────────────
  createSpeechRecognizer(onTranscript, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      if (onTranscript) onTranscript(fullTranscript);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (onError) onError(event.error);
    };

    return recognition;
  },

  // ── Web Audio Sound Synthesizer (Zero-Cost Soundboard) ──────
  playSoundEffect(effectId) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (effectId === 'applause') {
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(ctx.destination);
        noise.start();
      } else if (effectId === 'tada' || effectId === 'victory') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
        });
      } else if (effectId === 'chime') {
        const freqs = [880, 1318.51, 1760];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.65);
        });
      } else if (effectId === 'drumroll') {
        for (let i = 0; i < 15; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 120 + Math.random() * 20;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.06);
          osc.stop(ctx.currentTime + i * 0.06 + 0.09);
        }
      } else if (effectId === 'buzzer') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 130;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  },

  // Play incoming message notification chime
  playNotificationChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 587.33;
      osc2.frequency.value = 880.00;
      osc1.type = 'sine';
      osc2.type = 'sine';

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  },

  // ── Web Crypto API: AES-GCM 256-bit E2EE Helpers ────────────
  async deriveE2EEKey(secretPhrase) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secretPhrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode("yapper_e2ee_salt_v1"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  },

  async encryptE2EE(plaintext, key) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plaintext)
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const dataBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    return `${ivBase64}:${dataBase64}`;
  },

  async decryptE2EE(cipherString, key) {
    try {
      const [ivBase64, dataBase64] = cipherString.split(':');
      if (!ivBase64 || !dataBase64) return cipherString;

      const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
      const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      return "[🔒 Decryption Failed / Key Mismatch]";
    }
  },

  async getFingerprint(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const hash = await window.crypto.subtle.digest("SHA-256", exported);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' : ');
  },

  // ── iCalendar (.ics) File Generator for Events ──────────────
  generateICSFile(event) {
    const start = new Date(event.startDate || Date.now());
    const durationMins = event.durationMinutes || 60;
    const end = new Date(start.getTime() + durationMins * 60000);

    const formatDateICS = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Yapper Company Chat//Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id || 'evt_' + Date.now()}@yapper.chat`,
      `DTSTAMP:${formatDateICS(new Date())}`,
      `DTSTART:${formatDateICS(start)}`,
      `DTEND:${formatDateICS(end)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || 'Yapper Voice Stage'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ── Sentiment & Channel Analytics Helper ────────────────────
  analyzeChannelActivity(messages = []) {
    const stats = {
      totalMessages: messages.length,
      contributors: {},
      hourlyDistribution: new Array(24).fill(0),
      mediaCounts: { images: 0, videos: 0, audios: 0, files: 0, polls: 0, tasks: 0, kudos: 0, events: 0 },
      sentiment: { positive: 0, neutral: 0, constructive: 0, score: 0 }
    };

    const positiveWords = ['great', 'awesome', 'good', 'nice', 'thanks', 'cool', 'love', 'perfect', 'done', 'fixed', 'shipped', 'congrats', '🚀', '🔥', '❤️', '👍', '🎉', '🙌', 'kudos'];
    const constructiveWords = ['bug', 'issue', 'error', 'failed', 'problem', 'broken', 'slow', 'urgent', 'fix', 'blocker', 'delay'];

    messages.forEach(m => {
      const sender = m.senderName || 'Anonymous';
      stats.contributors[sender] = (stats.contributors[sender] || 0) + 1;

      if (m.timestamp) {
        const d = m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
        if (!isNaN(d.getTime())) {
          stats.hourlyDistribution[d.getHours()]++;
        }
      }

      if (m.poll) stats.mediaCounts.polls++;
      if (m.taskList) stats.mediaCounts.tasks++;
      if (m.kudos) stats.mediaCounts.kudos++;
      if (m.event) stats.mediaCounts.events++;
      (m.attachments || []).forEach(att => {
        if (att.type === 'image') stats.mediaCounts.images++;
        else if (att.type === 'video') stats.mediaCounts.videos++;
        else if (att.type === 'audio') stats.mediaCounts.audios++;
        else stats.mediaCounts.files++;
      });

      const text = (m.text || '').toLowerCase();
      let posHits = positiveWords.filter(w => text.includes(w)).length;
      let conHits = constructiveWords.filter(w => text.includes(w)).length;

      if (posHits > conHits) stats.sentiment.positive++;
      else if (conHits > posHits) stats.sentiment.constructive++;
      else stats.sentiment.neutral++;
    });

    const evaluated = stats.sentiment.positive + stats.sentiment.constructive + stats.sentiment.neutral;
    if (evaluated > 0) {
      stats.sentiment.score = Math.round(((stats.sentiment.positive - stats.sentiment.constructive) / evaluated) * 100);
    }

    return stats;
  },

  // ── Browser Reminders & Notifications ───────────────────────
  scheduleReminder(minutes, text, callback) {
    const ms = minutes * 60 * 1000;
    const triggerAt = Date.now() + ms;

    const reminders = JSON.parse(localStorage.getItem(window.CONSTANTS.STORAGE_KEYS.REMINDERS) || '[]');
    const newReminder = { id: this.generateId('rem'), text, triggerAt };
    reminders.push(newReminder);
    localStorage.setItem(window.CONSTANTS.STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));

    setTimeout(() => {
      this.playSoundEffect('chime');
      if (window.Notification && Notification.permission === 'granted') {
        new Notification("⏰ Yapper Reminder", {
          body: text,
          icon: 'favicon.ico'
        });
      }
      if (callback) callback(newReminder);
    }, ms);

    return newReminder;
  },

  // Export chat history to Markdown or JSON
  exportChatHistory(channelName, messages, format = 'md') {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `${channelName}_chat_export.${format}`;

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mimeType = 'application/json';
    } else {
      content = `# Yapper Chat Export — #${channelName}\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n\n---\n\n`;

      messages.forEach(msg => {
        const time = this.formatTime(msg.timestamp);
        content += `### **${msg.senderName}** _(${time})_\n`;
        if (msg.text) content += `${msg.text}\n\n`;
        if (msg.attachments && msg.attachments.length) {
          msg.attachments.forEach(att => {
            content += `- 📎 Attachment: [${att.name}](${att.url})\n`;
          });
          content += '\n';
        }
        if (msg.poll) {
          content += `📊 **Poll: ${msg.poll.question}**\n`;
          msg.poll.options.forEach(opt => {
            content += `  - [ ] ${opt.text} (${opt.voterUids?.length || 0} votes)\n`;
          });
          content += '\n';
        }
        if (msg.taskList) {
          content += `✅ **Task List: ${msg.taskList.title}**\n`;
          msg.taskList.items.forEach(item => {
            content += `  - [${item.done ? 'x' : ' '}] ${item.text}\n`;
          });
          content += '\n';
        }
        if (msg.kudos) {
          content += `🌟 **Kudos to ${msg.kudos.recipientName}:** ${msg.kudos.badge.name} — "${msg.kudos.reason}"\n\n`;
        }
        if (msg.event) {
          content += `📅 **Scheduled Event: ${msg.event.title}** (${msg.event.startDate})\n`;
          content += `  - Location: ${msg.event.location}\n`;
          content += `  - Details: ${msg.event.description}\n\n`;
        }
        content += '---\n\n';
      });
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.utils = utils;
