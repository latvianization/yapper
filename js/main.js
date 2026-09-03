// Main Vue 3 Application Controller for Yapper

const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } = Vue;

const app = createApp({
  components: window.YapperComponents,
  setup() {
    // ── Global Reactive State ─────────────────────────────────
    const currentUser = ref(null);
    const currentCompany = ref(null);
    const theme = ref(localStorage.getItem(window.CONSTANTS.STORAGE_KEYS.THEME) || 'dark');
    const audioEnabled = ref(localStorage.getItem(window.CONSTANTS.STORAGE_KEYS.AUDIO_ENABLED) !== 'false');
    const notifsEnabled = ref(localStorage.getItem(window.CONSTANTS.STORAGE_KEYS.NOTIFS_ENABLED) !== 'false');
    const isSidebarOpen = ref(false);
    const isDrawerOpen = ref(false);
    const isLoadingChat = ref(false);

    // ── Directory & Channel State ─────────────────────────────
    const companyUsers = ref([]);
    const companyChannels = ref([]);
    const companyInvites = ref([]);
    const companyEvents = ref([]);
    const pendingUserInvites = ref([]);

    // ── Active Conversation State ─────────────────────────────
    const activeChat = ref(null); // { id, name, type: 'channel'|'direct'|'group'|'event'|'bookmarks', raw, subtitle }
    const messages = ref([]);
    const isViewingBookmarks = ref(false);
    const bookmarks = ref(JSON.parse(localStorage.getItem(window.CONSTANTS.STORAGE_KEYS.BOOKMARKS) || '[]'));
    let messagesUnsubscribe = null;

    // ── Message Composition State ─────────────────────────────
    const messageText = ref('');
    const stagedAttachments = ref([]);
    const isUploading = ref(false);
    const activeReply = ref(null);
    const ephemeralDuration = ref(0); // 0 = off, ms duration

    // ── End-to-End Encryption (E2EE) State ────────────────────
    const isE2EEActive = ref(false);
    const e2eeKey = ref(null);
    const e2eeFingerprint = ref('');

    // ── Search & Filter State ─────────────────────────────────
    const searchQuery = ref('');
    const inChatSearchQuery = ref('');
    const showInChatSearch = ref(false);

    // ── Command Palette (⌘K) ──────────────────────────────────
    const isCommandPaletteOpen = ref(false);
    const commandSearchQuery = ref('');

    // ── Voice Memos & Speech Recognition ──────────────────────
    const isRecording = ref(false);
    const recordingDuration = ref(0);
    const liveTranscript = ref('');
    let speechRecognizer = null;
    let voiceMediaRecorder = null;
    let voiceChunks = [];
    let recordingTimer = null;

    // ── WebRTC Drop-in Audio Huddle ───────────────────────────
    const inHuddle = ref(false);
    const isMuted = ref(false);
    const isScreenSharing = ref(false);
    const huddleParticipants = ref([]);
    let huddleUnsubscribe = null;
    let screenStream = null;

    // ── Modals & Drawers State ────────────────────────────────
    const activeModal = ref(null); // 'invite', 'channel', 'personalGroup', 'profile', 'poll', 'createCompany', 'auth', 'whiteboard', 'videoRecord', 'analytics', 'auditLog', 'kudos', 'kudosLeaderboard', 'e2eeVerify', 'eventsHub', 'createEvent'
    const lightboxImage = ref(null);
    const showSoundboardMenu = ref(false);
    const auditLogsList = ref([]);
    const kudosLeaderboard = ref([]);

    // ── Form State ────────────────────────────────────
    const authForm = ref({ email: '', password: '', displayName: '', isSignUp: false, error: '' });
    const companyForm = ref({ name: '', error: '' });
    const inviteForm = ref({ email: '', role: 'member', isSubmitting: false });
    const channelForm = ref({ name: '', description: '', isPrivate: false, isSubmitting: false });
    const personalGroupForm = ref({ id: null, name: '', selectedMemberUids: [], isSubmitting: false });
    const profileForm = ref({ displayName: '', status: 'online', statusMessage: '' });
    const pollForm = ref({ question: '', options: ['', ''], isSubmitting: false });

    // ── Autocomplete / Mentions State ─────────────────────────
    const showMentionPopup = ref(false);
    const mentionQuery = ref('');

    // ── Toast Notifications ───────────────────────────────────
    const toasts = ref([]);
    const showToast = (message, type = 'info', duration = 3500) => {
      const id = Date.now() + Math.random();
      toasts.value.push({ id, message, type });
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, duration);
    };

    // ── Computed Helpers ──────────────────────────────────────
    const isOwnerOrAdmin = computed(() => {
      if (!currentUser.value) return false;
      return currentUser.value.role === window.CONSTANTS.ROLES.OWNER || currentUser.value.role === window.CONSTANTS.ROLES.ADMIN;
    });

    const activeLiveEvent = computed(() => {
      return companyEvents.value.find(e => e.isLive) || null;
    });

    const favoritesList = computed(() => {
      if (!currentUser.value || !currentUser.value.favorites) return [];
      const favIds = currentUser.value.favorites;
      return companyUsers.value.filter(u => favIds.includes(u.uid) && u.uid !== currentUser.value.uid);
    });

    const directMessageUsers = computed(() => {
      if (!currentUser.value) return [];
      return companyUsers.value.filter(u => u.uid !== currentUser.value.uid);
    });

    const filteredChannels = computed(() => {
      const q = searchQuery.value.toLowerCase().trim();
      if (!q) return companyChannels.value;
      return companyChannels.value.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    });

    const filteredDirectUsers = computed(() => {
      const q = searchQuery.value.toLowerCase().trim();
      if (!q) return directMessageUsers.value;
      return directMessageUsers.value.filter(u => 
        (u.displayName && u.displayName.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    });

    const personalGroups = computed(() => {
      return currentUser.value?.personalGroups || [];
    });

    const pinnedMessages = computed(() => {
      return messages.value.filter(m => m.isPinned);
    });

    const displayMessages = computed(() => {
      if (isViewingBookmarks.value) {
        return bookmarks.value;
      }
      const q = inChatSearchQuery.value.toLowerCase().trim();
      if (!q) return messages.value;

      if (q === 'has:image') return messages.value.filter(m => m.attachments?.some(a => a.type === 'image'));
      if (q === 'has:video') return messages.value.filter(m => m.attachments?.some(a => a.type === 'video'));
      if (q === 'has:audio') return messages.value.filter(m => m.attachments?.some(a => a.type === 'audio'));
      if (q === 'has:file') return messages.value.filter(m => m.attachments?.some(a => a.type === 'file'));
      if (q === 'has:event') return messages.value.filter(m => !!m.event);

      return messages.value.filter(m => 
        (m.text && m.text.toLowerCase().includes(q)) ||
        (m.senderName && m.senderName.toLowerCase().includes(q)) ||
        (m.transcript && m.transcript.toLowerCase().includes(q)) ||
        (m.attachments && m.attachments.some(a => a.name.toLowerCase().includes(q))) ||
        (m.event && m.event.title.toLowerCase().includes(q))
      );
    });

    const galleryItems = computed(() => {
      const items = { images: [], videos: [], audios: [], files: [] };
      messages.value.forEach(m => {
        (m.attachments || []).forEach(att => {
          if (att.type === 'image') items.images.push(att);
          else if (att.type === 'video') items.videos.push(att);
          else if (att.type === 'audio') items.audios.push(att);
          else items.files.push(att);
        });
      });
      return items;
    });

    const filteredMentionUsers = computed(() => {
      const q = mentionQuery.value.toLowerCase();
      return directMessageUsers.value.filter(u => 
        u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    });

    // ── Command Palette Items ──────────────────────────────────
    const allCommands = computed(() => {
      const list = [];

      // Events Navigation
      list.push({
        id: 'act_events_hub',
        title: 'Open Company Events Hub',
        category: 'Events',
        icon: 'fa-solid fa-calendar-days',
        action: () => { activeModal.value = 'eventsHub'; }
      });

      list.push({
        id: 'act_create_event',
        title: 'Schedule New Company Event',
        category: 'Events',
        icon: 'fa-solid fa-calendar-plus',
        action: () => { activeModal.value = 'createEvent'; }
      });

      // Channel navigation
      companyChannels.value.forEach(c => {
        list.push({
          id: `chan_${c.id}`,
          title: `Jump to #${c.name}`,
          category: 'Channels',
          icon: 'fa-solid fa-hashtag',
          action: () => selectChannel(c)
        });
      });

      // People navigation
      directMessageUsers.value.forEach(u => {
        list.push({
          id: `user_${u.uid}`,
          title: `Chat with ${u.displayName || u.email}`,
          category: 'People',
          icon: 'fa-solid fa-user',
          action: () => selectDirectChat(u)
        });
      });

      // Actions
      list.push({
        id: 'act_kudos',
        title: 'Award Peer Kudos Badge',
        category: 'Culture',
        icon: 'fa-solid fa-award',
        action: () => openKudosModal()
      });

      list.push({
        id: 'act_kudos_lb',
        title: 'View Kudos Leaderboard',
        category: 'Culture',
        icon: 'fa-solid fa-trophy',
        action: () => openKudosLeaderboardModal()
      });

      list.push({
        id: 'act_whiteboard',
        title: 'Open Whiteboard & Diagram Sketchpad',
        category: 'Actions',
        icon: 'fa-solid fa-paintbrush',
        action: () => { activeModal.value = 'whiteboard'; }
      });

      list.push({
        id: 'act_video_snip',
        title: 'Record Quick Video Snippet',
        category: 'Actions',
        icon: 'fa-solid fa-video',
        action: () => { activeModal.value = 'videoRecord'; }
      });

      list.push({
        id: 'act_analytics',
        title: 'View Channel Analytics & Sentiment',
        category: 'Analytics',
        icon: 'fa-solid fa-chart-pie',
        action: () => openAnalyticsModal()
      });

      if (isOwnerOrAdmin.value) {
        list.push({
          id: 'act_audit',
          title: 'Workspace Audit Logs & Governance',
          category: 'Admin',
          icon: 'fa-solid fa-shield-halved',
          action: () => openAuditModal()
        });
      }

      list.push({
        id: 'act_poll',
        title: 'Create Team Poll',
        category: 'Actions',
        icon: 'fa-solid fa-chart-simple',
        action: () => openPollModal()
      });

      list.push({
        id: 'act_huddle',
        title: 'Start Audio Huddle in Channel',
        category: 'Actions',
        icon: 'fa-solid fa-headphones',
        action: () => joinHuddle()
      });

      list.push({
        id: 'act_theme',
        title: 'Toggle Dark / Light Theme',
        category: 'Preferences',
        icon: 'fa-solid fa-circle-half-stroke',
        action: () => toggleTheme()
      });

      list.push({
        id: 'act_export',
        title: 'Export Chat History (.md)',
        category: 'Actions',
        icon: 'fa-solid fa-download',
        action: () => exportChat('md')
      });

      return list;
    });

    const filteredCommands = computed(() => {
      const q = commandSearchQuery.value.toLowerCase().trim();
      if (!q) return allCommands.value;
      return allCommands.value.filter(c => 
        c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      );
    });

    const executeCommand = (cmd) => {
      isCommandPaletteOpen.value = false;
      commandSearchQuery.value = '';
      if (cmd && cmd.action) cmd.action();
    };

    // ── Theme, Audio & Notifs ─────────────────────────────────
    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme.value);
      localStorage.setItem(window.CONSTANTS.STORAGE_KEYS.THEME, theme.value);
      showToast(`Theme switched to ${theme.value} mode`, 'info');
    };

    const toggleAudio = () => {
      audioEnabled.value = !audioEnabled.value;
      localStorage.setItem(window.CONSTANTS.STORAGE_KEYS.AUDIO_ENABLED, audioEnabled.value);
      showToast(audioEnabled.value ? 'Sound effects enabled' : 'Sound effects muted', 'info');
    };

    const toggleNotifs = async () => {
      if (!notifsEnabled.value && window.Notification && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          showToast('Notification permission denied by browser', 'error');
          return;
        }
      }
      notifsEnabled.value = !notifsEnabled.value;
      localStorage.setItem(window.CONSTANTS.STORAGE_KEYS.NOTIFS_ENABLED, notifsEnabled.value);
      showToast(notifsEnabled.value ? 'Desktop notifications enabled' : 'Notifications disabled', 'info');
    };

    // ── Soundboard Playback ────────────────────────────────────
    const triggerSoundboard = async (effectId) => {
      showSoundboardMenu.value = false;
      window.utils.playSoundEffect(effectId);
      
      if (activeChat.value && currentUser.value) {
        const effectObj = window.CONSTANTS.SOUNDBOARD_EFFECTS.find(s => s.id === effectId);
        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: `🔊 Played **${effectObj?.name || effectId}** sound effect!`,
          soundEffect: effectId
        });
      }
      showToast(`Sound effect played`, 'info');
    };

    // ── E2EE Secret Chat Toggle & Key Initialization ──────────
    const initE2EESession = async (chatId) => {
      try {
        const secret = `e2ee_secret_${chatId}_v1`;
        e2eeKey.value = await window.utils.deriveE2EEKey(secret);
        e2eeFingerprint.value = await window.utils.getFingerprint(e2eeKey.value);
      } catch (err) {
        console.warn("E2EE key derivation warning:", err);
      }
    };

    const toggleE2EE = () => {
      if (activeChat.value?.type !== 'direct') {
        showToast('E2EE secret chat is currently supported for Direct Messages', 'info');
        return;
      }
      isE2EEActive.value = !isE2EEActive.value;
      showToast(isE2EEActive.value ? '🔒 E2EE Secret Chat Enabled (AES-GCM 256-bit)' : 'E2EE Secret Chat Disabled', 'info');
    };

    const openE2EEVerifyModal = () => {
      activeModal.value = 'e2eeVerify';
    };

    // ── Navigation & Chat Selection ───────────────────────────
    const selectChannel = (channel) => {
      isViewingBookmarks.value = false;
      isE2EEActive.value = false;
      isLoadingChat.value = true;
      activeChat.value = {
        id: channel.id,
        name: channel.name,
        type: 'channel',
        raw: channel,
        subtitle: channel.description || `${channel.memberUids?.length || 1} members`
      };
      isSidebarOpen.value = false;
      bindChatMessages(channel.id);
      setTimeout(() => { isLoadingChat.value = false; }, 200);
    };

    const selectDirectChat = async (user) => {
      if (!currentUser.value) return;
      isViewingBookmarks.value = false;
      isLoadingChat.value = true;
      const dmChat = await window.fbHelper.getOrCreateDirectChat(currentCompany.value?.id, currentUser.value, user);
      activeChat.value = {
        id: dmChat.id,
        name: user.displayName || user.email,
        type: 'direct',
        raw: user,
        targetUser: user,
        subtitle: user.statusMessage || user.status || 'Direct Message'
      };
      isSidebarOpen.value = false;
      await initE2EESession(dmChat.id);
      bindChatMessages(dmChat.id);
      setTimeout(() => { isLoadingChat.value = false; }, 200);
    };

    const selectPersonalGroup = (group) => {
      isViewingBookmarks.value = false;
      isE2EEActive.value = false;
      isLoadingChat.value = true;
      const groupId = `pgrp_${group.id}`;
      activeChat.value = {
        id: groupId,
        name: group.name,
        type: 'group',
        raw: group,
        subtitle: `Custom Group (${group.memberUids?.length || 0} members)`
      };
      isSidebarOpen.value = false;
      bindChatMessages(groupId);
      setTimeout(() => { isLoadingChat.value = false; }, 200);
    };

    const selectEventChat = (event) => {
      isViewingBookmarks.value = false;
      isE2EEActive.value = false;
      isLoadingChat.value = true;
      const eventChatId = `event_${event.id}`;
      activeChat.value = {
        id: eventChatId,
        name: event.title,
        type: 'event',
        raw: event,
        subtitle: `Event Chat • ${window.utils.formatEventDateTime(event.startDate)} • ${event.location || 'Stage'}`
      };
      activeModal.value = null;
      isSidebarOpen.value = false;
      bindChatMessages(eventChatId);
      setTimeout(() => { isLoadingChat.value = false; }, 200);
    };

    const openBookmarksView = () => {
      isViewingBookmarks.value = true;
      isE2EEActive.value = false;
      activeChat.value = {
        id: 'bookmarks_view',
        name: 'Saved Messages',
        type: 'bookmarks',
        subtitle: `${bookmarks.value.length} bookmarked items`
      };
      isSidebarOpen.value = false;
      if (messagesUnsubscribe) messagesUnsubscribe();
    };

    const bindChatMessages = (chatId) => {
      if (messagesUnsubscribe) messagesUnsubscribe();
      messages.value = [];

      messagesUnsubscribe = window.fbHelper.listenToChatMessages(chatId, async (newMsgs) => {
        const prevCount = messages.value.length;
        
        // Transparently decrypt E2EE messages if key available
        const processed = await Promise.all(newMsgs.map(async (m) => {
          if (m.isE2EE && m.cipherPayload && e2eeKey.value) {
            const decText = await window.utils.decryptE2EE(m.cipherPayload, e2eeKey.value);
            return { ...m, text: decText };
          }
          return m;
        }));

        messages.value = processed;

        if (processed.length > prevCount && prevCount > 0) {
          const lastMsg = processed[processed.length - 1];
          if (lastMsg.senderId !== currentUser.value?.uid) {
            if (audioEnabled.value) window.utils.playNotificationChime();
            if (lastMsg.soundEffect) window.utils.playSoundEffect(lastMsg.soundEffect);
            if (notifsEnabled.value && window.Notification && Notification.permission === 'granted') {
              new Notification(`New message from ${lastMsg.senderName}`, {
                body: lastMsg.text || 'Sent an attachment',
                icon: 'favicon.ico'
              });
            }
          }
        }
        scrollToBottom();
      });
    };

    const scrollToBottom = () => {
      nextTick(() => {
        const container = document.getElementById('messagesScroll');
        if (container) container.scrollTop = container.scrollHeight;
      });
    };

    const scrollToMessage = (msgId) => {
      nextTick(() => {
        const el = document.getElementById(`msg_${msgId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('message-highlight');
          setTimeout(() => el.classList.remove('message-highlight'), 1800);
        }
      });
    };

    // ── Attachments Handling ──────────────────────────────────
    const handleFileSelect = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      isUploading.value = true;
      for (const file of files) {
        try {
          const uploaded = await window.fbHelper.uploadAttachment(file);
          stagedAttachments.value.push(uploaded);
        } catch (err) {
          showToast(`Error attaching ${file.name}`, 'error');
        }
      }
      isUploading.value = false;
      e.target.value = '';
    };

    const removeStagedAttachment = (idx) => {
      stagedAttachments.value.splice(idx, 1);
    };

    // ── Slash Commands Processor ──────────────────────────────
    const handleSlashCommand = async (rawText) => {
      const parts = rawText.trim().split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      if (cmd === '/events') {
        activeModal.value = 'eventsHub';
        messageText.value = '';
        return true;
      }

      if (cmd === '/event') {
        activeModal.value = 'createEvent';
        messageText.value = '';
        return true;
      }

      if (cmd === '/shrug') {
        messageText.value = args ? `${args} ¯\\_(ツ)_/¯` : `¯\\_(ツ)_/¯`;
        return false;
      }

      if (cmd === '/clear') {
        inChatSearchQuery.value = '';
        showInChatSearch.value = false;
        messageText.value = '';
        showToast('Search filters cleared', 'info');
        return true;
      }

      if (cmd === '/standup') {
        messageText.value = `### ☀️ Daily Async Standup\n- **Yesterday:** \n- **Today:** \n- **Blockers:** None`;
        return false;
      }

      if (cmd === '/table') {
        messageText.value = `| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Data 1 | Data 2 | Data 3 |\n| Data 4 | Data 5 | Data 6 |`;
        return false;
      }

      if (cmd === '/kudos') {
        openKudosModal();
        messageText.value = '';
        return true;
      }

      if (cmd === '/remind') {
        const mins = parseInt(parts[1]) || 5;
        const note = parts.slice(2).join(' ') || 'Reminder alarm!';
        window.utils.scheduleReminder(mins, note, (rem) => {
          showToast(`⏰ Reminder: ${rem.text}`, 'info');
        });
        messageText.value = '';
        showToast(`Reminder set for ${mins} minute(s) from now`, 'success');
        return true;
      }

      if (cmd === '/poll') {
        openPollModal();
        if (args) pollForm.value.question = args;
        messageText.value = '';
        return true;
      }

      if (cmd === '/todo') {
        const items = args.split(',').map(s => s.trim()).filter(Boolean);
        if (items.length === 0) {
          showToast('Provide items e.g. /todo Review PR, Deploy, Update docs', 'info');
          return true;
        }

        const taskObj = {
          title: 'Team Checklist',
          items: items.map(text => ({ text, done: false, completedBy: null }))
        };

        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: '',
          taskList: taskObj,
          ephemeralDuration: ephemeralDuration.value
        });
        messageText.value = '';
        showToast('Checklist card created!', 'success');
        return true;
      }

      return false;
    };

    // ── Sending Messages ──────────────────────────────────────
    const sendMessage = async () => {
      const text = messageText.value.trim();
      const attachments = [...stagedAttachments.value];

      if (!text && attachments.length === 0) return;
      if (!activeChat.value || !currentUser.value) return;

      if (text.startsWith('/')) {
        const handled = await handleSlashCommand(text);
        if (handled) return;
      }

      let cipherPayload = null;
      let plainTextToSend = messageText.value.trim();

      if (isE2EEActive.value && e2eeKey.value) {
        cipherPayload = await window.utils.encryptE2EE(plainTextToSend, e2eeKey.value);
        plainTextToSend = ''; // Hide plaintext in raw database
      }

      const payload = {
        senderId: currentUser.value.uid,
        senderName: currentUser.value.displayName || currentUser.value.email,
        senderPhoto: currentUser.value.photoURL || '',
        text: plainTextToSend,
        isE2EE: isE2EEActive.value,
        cipherPayload: cipherPayload,
        attachments: attachments,
        replyTo: activeReply.value ? { ...activeReply.value } : null,
        ephemeralDuration: ephemeralDuration.value
      };

      messageText.value = '';
      stagedAttachments.value = [];
      activeReply.value = null;
      showMentionPopup.value = false;

      try {
        await window.fbHelper.sendMessage(activeChat.value.id, payload);
        scrollToBottom();
      } catch (err) {
        showToast('Error sending message', 'error');
      }
    };

    const addEmoji = (emoji) => {
      messageText.value += emoji;
    };

    const addRandomEmoji = () => {
      const list = window.CONSTANTS.EMOJI_LIST || ['👍', '❤️', '🔥', '😂', '🚀', '🎉'];
      const emoji = list[Math.floor(Math.random() * list.length)];
      addEmoji(emoji);
    };

    const handleTextInput = (e) => {
      const val = e.target.value;
      const lastAt = val.lastIndexOf('@');
      if (lastAt >= 0 && lastAt === val.length - 1) {
        showMentionPopup.value = true;
        mentionQuery.value = '';
      } else if (lastAt >= 0 && lastAt > val.lastIndexOf(' ')) {
        showMentionPopup.value = true;
        mentionQuery.value = val.substring(lastAt + 1);
      } else {
        showMentionPopup.value = false;
      }
    };

    const insertMention = (user) => {
      const val = messageText.value;
      const lastAt = val.lastIndexOf('@');
      messageText.value = val.substring(0, lastAt) + `@${user.displayName || user.email} `;
      showMentionPopup.value = false;
    };

    const handleQuickAction = (actionKey) => {
      if (actionKey === 'say-hello') {
        messageText.value = '👋 Hey team!';
        sendMessage();
      } else if (actionKey === 'start-poll') {
        openPollModal();
      } else if (actionKey === 'attach-file') {
        const input = document.querySelector('input[type="file"]');
        if (input) input.click();
      } else if (actionKey === 'start-huddle') {
        joinHuddle();
      } else if (actionKey === 'whiteboard') {
        activeModal.value = 'whiteboard';
      } else if (actionKey === 'give-kudos') {
        openKudosModal();
      } else if (actionKey === 'schedule-event') {
        activeModal.value = 'createEvent';
      }
    };

    // ── Voice Memos & Speech Recognition ──────────────────────
    const startVoiceRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceChunks = [];
        liveTranscript.value = '';

        voiceMediaRecorder = new MediaRecorder(stream);
        voiceMediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) voiceChunks.push(e.data);
        };
        voiceMediaRecorder.start();

        speechRecognizer = window.utils.createSpeechRecognizer((transcript) => {
          liveTranscript.value = transcript;
        });
        if (speechRecognizer) {
          try { speechRecognizer.start(); } catch (e) {}
        }

        isRecording.value = true;
        recordingDuration.value = 0;
        recordingTimer = setInterval(() => {
          recordingDuration.value++;
        }, 1000);
      } catch (err) {
        showToast('Microphone access denied or unavailable', 'error');
      }
    };

    const stopAndSendVoiceRecording = async () => {
      if (!voiceMediaRecorder) return;
      clearInterval(recordingTimer);
      if (speechRecognizer) {
        try { speechRecognizer.stop(); } catch (e) {}
      }

      voiceMediaRecorder.onstop = async () => {
        const blob = new Blob(voiceChunks, { type: 'audio/webm' });
        const file = new File([blob], `voice_memo_${Date.now()}.webm`, { type: 'audio/webm' });
        const transcriptText = liveTranscript.value.trim();

        isRecording.value = false;
        isUploading.value = true;

        try {
          const uploaded = await window.fbHelper.uploadAttachment(file);
          await window.fbHelper.sendMessage(activeChat.value.id, {
            senderId: currentUser.value.uid,
            senderName: currentUser.value.displayName || currentUser.value.email,
            senderPhoto: currentUser.value.photoURL || '',
            text: `🎙️ Voice Memo (${window.utils.formatDuration(recordingDuration.value)})`,
            transcript: transcriptText,
            attachments: [uploaded],
            ephemeralDuration: ephemeralDuration.value
          });
          showToast('Voice memo sent!', 'success');
        } catch (err) {
          showToast('Error uploading voice memo', 'error');
        } finally {
          isUploading.value = false;
          recordingDuration.value = 0;
          liveTranscript.value = '';
        }
      };

      voiceMediaRecorder.stop();
      voiceMediaRecorder.stream.getTracks().forEach(t => t.stop());
    };

    const cancelVoiceRecording = () => {
      if (voiceMediaRecorder) {
        voiceMediaRecorder.stop();
        voiceMediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
      if (speechRecognizer) {
        try { speechRecognizer.stop(); } catch (e) {}
      }
      clearInterval(recordingTimer);
      isRecording.value = false;
      recordingDuration.value = 0;
      liveTranscript.value = '';
    };

    // ── Company Events & RSVP Handlers ─────────────────────────
    const handleSaveEvent = async (eventData) => {
      if (!currentCompany.value || !currentUser.value) return;
      activeModal.value = null;

      try {
        const created = await window.fbHelper.createCompanyEvent(currentCompany.value.id, {
          ...eventData,
          hostUid: currentUser.value.uid,
          hostName: currentUser.value.displayName || currentUser.value.email
        });

        companyEvents.value.unshift(created);
        showToast(`Event "${created.title}" scheduled!`, 'success');

        // Post announcement card into active channel if requested
        if (eventData.postToActiveChannel && activeChat.value) {
          await window.fbHelper.sendMessage(activeChat.value.id, {
            senderId: currentUser.value.uid,
            senderName: currentUser.value.displayName || currentUser.value.email,
            senderPhoto: currentUser.value.photoURL || '',
            text: `📅 **New Company Event Scheduled!**`,
            event: created
          });
        }
      } catch (err) {
        showToast('Error scheduling event', 'error');
      }
    };

    const handleRsvpEvent = async ({ eventId, status }) => {
      if (!currentCompany.value || !currentUser.value) return;
      await window.fbHelper.rsvpEvent(currentCompany.value.id, eventId, status, currentUser.value);
      companyEvents.value = await window.fbHelper.getCompanyEvents(currentCompany.value.id);
      showToast(`RSVP updated: ${status}`, 'success');
    };

    const handleToggleLiveEvent = async ({ eventId, isLive }) => {
      if (!currentCompany.value) return;
      await window.fbHelper.toggleLiveEvent(currentCompany.value.id, eventId, isLive);
      companyEvents.value = await window.fbHelper.getCompanyEvents(currentCompany.value.id);
      showToast(isLive ? '🔴 Event is now LIVE!' : 'Event live stage ended', 'info');
      if (isLive) {
        window.utils.playSoundEffect('tada');
      }
    };

    // ── Whiteboard & Video Snippet Send Handlers ──────────────
    const handleSendWhiteboardDiagram = async (file) => {
      activeModal.value = null;
      isUploading.value = true;
      try {
        const uploaded = await window.fbHelper.uploadAttachment(file);
        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: `🖌️ Whiteboard Diagram`,
          attachments: [uploaded],
          ephemeralDuration: ephemeralDuration.value
        });
        showToast('Diagram posted to chat', 'success');
      } catch (err) {
        showToast('Error posting diagram', 'error');
      } finally {
        isUploading.value = false;
      }
    };

    const handleSendVideoSnippet = async (file) => {
      activeModal.value = null;
      isUploading.value = true;
      try {
        const uploaded = await window.fbHelper.uploadAttachment(file);
        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: `📹 Quick Video Snippet`,
          attachments: [uploaded],
          ephemeralDuration: ephemeralDuration.value
        });
        showToast('Video snippet sent', 'success');
      } catch (err) {
        showToast('Error sending video snippet', 'error');
      } finally {
        isUploading.value = false;
      }
    };

    // ── Kudos Peer Recognition Handlers ───────────────────────
    const openKudosModal = () => {
      activeModal.value = 'kudos';
    };

    const openKudosLeaderboardModal = async () => {
      if (!currentCompany.value) return;
      kudosLeaderboard.value = await window.fbHelper.getKudosLeaderboard(currentCompany.value.id);
      activeModal.value = 'kudosLeaderboard';
    };

    const handleSendKudos = async (kudosPayload) => {
      if (!activeChat.value || !currentUser.value || !currentCompany.value) return;
      activeModal.value = null;

      const fullData = {
        ...kudosPayload,
        senderId: currentUser.value.uid,
        senderName: currentUser.value.displayName || currentUser.value.email
      };

      try {
        await window.fbHelper.awardKudos(currentCompany.value.id, fullData);

        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: '',
          kudos: fullData
        });

        window.utils.playSoundEffect('tada');
        showToast(`Kudos awarded to @${kudosPayload.recipientName}! 🌟`, 'success');
      } catch (err) {
        showToast('Error awarding kudos', 'error');
      }
    };

    // ── Reactions, Edit, Delete, Pin, Bookmarks ────────────────
    const handleReact = async ({ messageId, emoji }) => {
      if (!currentUser.value || !activeChat.value) return;
      await window.fbHelper.toggleReaction(activeChat.value.id, messageId, emoji, currentUser.value);
    };

    const handleEditMessage = async ({ messageId, text }) => {
      if (!activeChat.value) return;
      await window.fbHelper.editMessage(activeChat.value.id, messageId, text);
      showToast('Message updated', 'info');
    };

    const handleDeleteMessage = async (messageId) => {
      if (!confirm('Delete this message?')) return;
      if (!activeChat.value) return;
      await window.fbHelper.deleteMessage(activeChat.value.id, messageId);
      showToast('Message deleted', 'info');
    };

    const handleTogglePin = async (message) => {
      if (!activeChat.value) return;
      await window.fbHelper.togglePinMessage(activeChat.value.id, message.id, message.isPinned);
      showToast(message.isPinned ? 'Message unpinned' : 'Message pinned to channel', 'info');
    };

    const handleToggleTask = async ({ messageId, itemIndex }) => {
      if (!activeChat.value || !currentUser.value) return;
      await window.fbHelper.toggleTaskItem(activeChat.value.id, messageId, itemIndex, currentUser.value);
    };

    const handleReplyTo = (message) => {
      activeReply.value = {
        id: message.id,
        senderName: message.senderName,
        text: message.text || (message.attachments?.length ? `[Attachment: ${message.attachments[0].name}]` : '')
      };
      nextTick(() => {
        const ta = document.querySelector('.chat-textarea');
        if (ta) ta.focus();
      });
    };

    const toggleBookmark = (message) => {
      const idx = bookmarks.value.findIndex(b => b.id === message.id);
      if (idx >= 0) {
        bookmarks.value.splice(idx, 1);
        showToast('Removed from saved bookmarks', 'info');
      } else {
        bookmarks.value.push({ ...message, savedAt: new Date().toISOString() });
        showToast('Saved message to bookmarks', 'success');
      }
      localStorage.setItem(window.CONSTANTS.STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks.value));
    };

    const isMessageBookmarked = (messageId) => {
      return bookmarks.value.some(b => b.id === messageId);
    };

    // ── Interactive Team Polls ─────────────────────────────────
    const openPollModal = () => {
      pollForm.value = { question: '', options: ['', ''], isSubmitting: false };
      activeModal.value = 'poll';
    };

    const addPollOption = () => {
      if (pollForm.value.options.length < 6) {
        pollForm.value.options.push('');
      }
    };

    const removePollOption = (idx) => {
      if (pollForm.value.options.length > 2) {
        pollForm.value.options.splice(idx, 1);
      }
    };

    const handleCreatePoll = async () => {
      const question = pollForm.value.question.trim();
      const validOptions = pollForm.value.options.map(o => o.trim()).filter(Boolean);

      if (!question || validOptions.length < 2 || !activeChat.value || !currentUser.value) return;
      pollForm.value.isSubmitting = true;

      try {
        const pollObj = {
          question,
          options: validOptions.map(text => ({ text, voterUids: [] })),
          createdBy: currentUser.value.uid,
          createdAt: new Date().toISOString()
        };

        await window.fbHelper.sendMessage(activeChat.value.id, {
          senderId: currentUser.value.uid,
          senderName: currentUser.value.displayName || currentUser.value.email,
          senderPhoto: currentUser.value.photoURL || '',
          text: '',
          poll: pollObj,
          ephemeralDuration: ephemeralDuration.value
        });

        activeModal.value = null;
        showToast('Poll published!', 'success');
      } catch (err) {
        showToast('Error creating poll', 'error');
      } finally {
        pollForm.value.isSubmitting = false;
      }
    };

    const handleVotePoll = async ({ messageId, optionIndex }) => {
      if (!activeChat.value || !currentUser.value) return;
      await window.fbHelper.votePoll(activeChat.value.id, messageId, optionIndex, currentUser.value);
    };

    // ── WebRTC Drop-in Audio Huddle & Screen Sharing ───────────
    const joinHuddle = () => {
      if (!activeChat.value || (activeChat.value.type !== 'channel' && activeChat.value.type !== 'event')) {
        showToast('Huddles are supported in company channels and event stages', 'info');
        return;
      }
      inHuddle.value = true;
      isMuted.value = false;
      window.fbHelper.joinHuddle(activeChat.value.id, currentUser.value);

      huddleUnsubscribe = window.fbHelper.listenToHuddleParticipants(activeChat.value.id, (parts) => {
        huddleParticipants.value = parts;
      });

      showToast(`Joined Stage Audio Huddle`, 'success');
    };

    const leaveHuddle = () => {
      if (activeChat.value) {
        window.fbHelper.leaveHuddle(activeChat.value.id, currentUser.value.uid);
      }
      if (huddleUnsubscribe) huddleUnsubscribe();
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
        isScreenSharing.value = false;
      }
      inHuddle.value = false;
      huddleParticipants.value = [];
      showToast('Left Audio Huddle', 'info');
    };

    const toggleMute = () => {
      isMuted.value = !isMuted.value;
      showToast(isMuted.value ? 'Microphone muted' : 'Microphone unmuted', 'info');
    };

    const toggleScreenShare = async () => {
      if (!isScreenSharing.value) {
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          isScreenSharing.value = true;
          screenStream.getVideoTracks()[0].onended = () => {
            isScreenSharing.value = false;
            screenStream = null;
          };
          showToast('Screen sharing started', 'success');
        } catch (err) {
          showToast('Screen share cancelled', 'info');
        }
      } else {
        if (screenStream) screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
        isScreenSharing.value = false;
        showToast('Screen sharing stopped', 'info');
      }
    };

    // ── Export Chat History ────────────────────────────────────
    const exportChat = (format) => {
      if (!activeChat.value || messages.value.length === 0) {
        showToast('No messages to export', 'info');
        return;
      }
      window.utils.exportChatHistory(activeChat.value.name, messages.value, format);
      showToast(`Exported ${activeChat.value.name} as .${format}`, 'success');
    };

    // ── Analytics & Audit Modals ──────────────────────────────
    const openAnalyticsModal = () => {
      if (!activeChat.value) return;
      activeModal.value = 'analytics';
    };

    const openAuditModal = async () => {
      if (!currentCompany.value) return;
      auditLogsList.value = await window.fbHelper.getAuditLogs(currentCompany.value.id);
      activeModal.value = 'auditLog';
    };

    // ── Favorites & User Directory ─────────────────────────────
    const toggleFavorite = async (targetUid) => {
      if (!currentUser.value) return;
      const currentFavs = currentUser.value.favorites || [];
      const updated = await window.fbHelper.toggleFavorite(currentUser.value.uid, targetUid, currentFavs);
      currentUser.value.favorites = updated;
      showToast(updated.includes(targetUid) ? 'Added to favorites' : 'Removed from favorites', 'info');
    };

    const isUserFavorite = (targetUid) => {
      return (currentUser.value?.favorites || []).includes(targetUid);
    };

    // ── Company & Team Actions ─────────────────────────────────
    const loadCompanyData = async (companyId) => {
      if (!companyId) return;
      currentCompany.value = await window.fbHelper.getCompany(companyId);
      companyUsers.value = await window.fbHelper.getCompanyUsers(companyId);
      companyChannels.value = await window.fbHelper.getCompanyChannels(companyId);
      companyInvites.value = await window.fbHelper.getCompanyInvites(companyId);
      companyEvents.value = await window.fbHelper.getCompanyEvents(companyId);

      if (!activeChat.value && companyChannels.value.length > 0) {
        const gen = companyChannels.value.find(c => c.name === 'general') || companyChannels.value[0];
        selectChannel(gen);
      }
    };

    const handleCreateCompany = async () => {
      if (!companyForm.value.name.trim() || !currentUser.value) return;
      try {
        const company = await window.fbHelper.createCompany(companyForm.value.name.trim(), currentUser.value);
        currentUser.value.companyId = company.id;
        currentUser.value.role = window.CONSTANTS.ROLES.OWNER;
        activeModal.value = null;
        companyForm.value.name = '';
        await loadCompanyData(company.id);
        showToast(`Workspace "${company.name}" created!`, 'success');
      } catch (err) {
        companyForm.value.error = err.message;
      }
    };

    const handleSendInvite = async () => {
      if (!inviteForm.value.email.trim() || !currentCompany.value || !currentUser.value) return;
      inviteForm.value.isSubmitting = true;
      try {
        await window.fbHelper.sendInvite(
          currentCompany.value.id,
          currentCompany.value.name,
          inviteForm.value.email,
          inviteForm.value.role,
          currentUser.value
        );
        showToast(`Invite sent to ${inviteForm.value.email}`, 'success');
        inviteForm.value.email = '';
        activeModal.value = null;
        companyInvites.value = await window.fbHelper.getCompanyInvites(currentCompany.value.id);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        inviteForm.value.isSubmitting = false;
      }
    };

    const handleRevokeInvite = async (inviteId) => {
      await window.fbHelper.revokeInvite(inviteId, currentCompany.value?.id, currentUser.value?.displayName);
      companyInvites.value = companyInvites.value.filter(i => i.id !== inviteId);
      showToast('Invite revoked', 'info');
    };

    // ── Channel & Personal Group Creation ──────────────────────
    const handleCreateChannel = async () => {
      if (!channelForm.value.name.trim() || !currentCompany.value || !currentUser.value) return;
      channelForm.value.isSubmitting = true;
      try {
        const newChan = await window.fbHelper.createChannel(currentCompany.value.id, {
          name: channelForm.value.name,
          description: channelForm.value.description,
          isPrivate: channelForm.value.isPrivate,
          createdBy: currentUser.value.uid
        });
        companyChannels.value.push(newChan);
        activeModal.value = null;
        channelForm.value.name = '';
        channelForm.value.description = '';
        showToast(`Channel #${newChan.name} created`, 'success');
        selectChannel(newChan);
      } catch (err) {
        showToast('Error creating channel', 'error');
      } finally {
        channelForm.value.isSubmitting = false;
      }
    };

    const openCreatePersonalGroupModal = () => {
      personalGroupForm.value = {
        id: window.utils.generateId('pgrp'),
        name: '',
        selectedMemberUids: [],
        isSubmitting: false
      };
      activeModal.value = 'personalGroup';
    };

    const toggleMemberSelection = (uid) => {
      const idx = personalGroupForm.value.selectedMemberUids.indexOf(uid);
      if (idx >= 0) {
        personalGroupForm.value.selectedMemberUids.splice(idx, 1);
      } else {
        personalGroupForm.value.selectedMemberUids.push(uid);
      }
    };

    const handleSavePersonalGroup = async () => {
      if (!personalGroupForm.value.name.trim() || !currentUser.value) return;
      personalGroupForm.value.isSubmitting = true;
      try {
        const groupObj = {
          id: personalGroupForm.value.id || window.utils.generateId('pgrp'),
          name: personalGroupForm.value.name.trim(),
          memberUids: [currentUser.value.uid, ...personalGroupForm.value.selectedMemberUids],
          createdAt: new Date().toISOString()
        };

        const updated = await window.fbHelper.savePersonalGroup(
          currentUser.value.uid,
          groupObj,
          currentUser.value.personalGroups || []
        );
        currentUser.value.personalGroups = updated;
        activeModal.value = null;
        showToast(`Personal group "${groupObj.name}" saved`, 'success');
        selectPersonalGroup(groupObj);
      } catch (err) {
        showToast('Error saving personal group', 'error');
      } finally {
        personalGroupForm.value.isSubmitting = false;
      }
    };

    const deletePersonalGroup = async (groupId) => {
      if (!confirm('Delete this custom group?')) return;
      const updated = await window.fbHelper.deletePersonalGroup(
        currentUser.value.uid,
        groupId,
        currentUser.value.personalGroups || []
      );
      currentUser.value.personalGroups = updated;
      if (activeChat.value?.id === `pgrp_${groupId}`) {
        activeChat.value = null;
      }
      showToast('Personal group deleted', 'info');
    };

    // ── Profile Updates & Status Presets ───────────────────────
    const openProfileModal = () => {
      if (!currentUser.value) return;
      profileForm.value = {
        displayName: currentUser.value.displayName || '',
        status: currentUser.value.status || 'online',
        statusMessage: currentUser.value.statusMessage || ''
      };
      activeModal.value = 'profile';
    };

    const applyStatusPreset = (preset) => {
      profileForm.value.statusMessage = `${preset.icon} ${preset.text}`;
      profileForm.value.status = preset.status;
    };

    const handleSaveProfile = async () => {
      if (!currentUser.value) return;
      try {
        await window.fbHelper.saveUserProfile(currentUser.value.uid, {
          displayName: profileForm.value.displayName,
          status: profileForm.value.status,
          statusMessage: profileForm.value.statusMessage
        });
        currentUser.value.displayName = profileForm.value.displayName;
        currentUser.value.status = profileForm.value.status;
        currentUser.value.statusMessage = profileForm.value.statusMessage;
        activeModal.value = null;
        showToast('Profile updated', 'success');
      } catch (err) {
        showToast('Error updating profile', 'error');
      }
    };

    // ── Authentication & Instant Demo Mode ─────────────────────
    const handleAuthSubmit = async () => {
      authForm.value.error = '';
      try {
        if (authForm.value.isSignUp) {
          await window.fbHelper.signUpWithEmail(
            authForm.value.email,
            authForm.value.password,
            authForm.value.displayName
          );
        } else {
          await window.fbHelper.signInWithEmail(
            authForm.value.email,
            authForm.value.password
          );
        }
        activeModal.value = null;
      } catch (err) {
        authForm.value.error = err.message;
      }
    };

    const handleGoogleSignIn = async () => {
      try {
        await window.fbHelper.signInWithGoogle();
        activeModal.value = null;
      } catch (err) {
        showToast(err.message, 'error');
      }
    };

    const handleSignOut = async () => {
      if (inHuddle) leaveHuddle();
      await window.fbHelper.signOut();
      localStorage.removeItem('yapper_demo_user');
      currentUser.value = null;
      currentCompany.value = null;
      activeChat.value = null;
      messages.value = [];
      showToast('Signed out', 'info');
    };

    const loginAsDemoUser = async (role = 'founder') => {
      const demoUsers = {
        founder: {
          uid: 'demo_user_1',
          email: 'alice@acmecorp.io',
          displayName: 'Alice (Founder)',
          companyId: 'demo_company_1',
          role: 'owner',
          status: 'online',
          statusMessage: '🚀 Scaling Yapper',
          favorites: ['demo_user_2'],
          personalGroups: [{ id: 'pgrp_core', name: 'Core Leads', memberUids: ['demo_user_1', 'demo_user_2'] }]
        },
        engineer: {
          uid: 'demo_user_2',
          email: 'bob@acmecorp.io',
          displayName: 'Bob (Lead Dev)',
          companyId: 'demo_company_1',
          role: 'member',
          status: 'busy',
          statusMessage: '🎧 Deep Focus / Coding',
          favorites: ['demo_user_1'],
          personalGroups: []
        }
      };

      const user = demoUsers[role] || demoUsers.founder;
      localStorage.setItem('yapper_demo_user', JSON.stringify(user));
      currentUser.value = user;
      activeModal.value = null;

      currentCompany.value = {
        id: 'demo_company_1',
        name: 'Acme Technologies',
        ownerId: 'demo_user_1'
      };

      companyUsers.value = [
        demoUsers.founder,
        demoUsers.engineer,
        {
          uid: 'demo_user_3',
          email: 'claire@acmecorp.io',
          displayName: 'Claire (Product Designer)',
          companyId: 'demo_company_1',
          role: 'member',
          status: 'away',
          statusMessage: '🥪 Out for lunch',
          favorites: [],
          personalGroups: []
        },
        {
          uid: 'demo_user_4',
          email: 'david@acmecorp.io',
          displayName: 'David (Growth)',
          companyId: 'demo_company_1',
          role: 'member',
          status: 'online',
          statusMessage: '📈 Analyzing metrics',
          favorites: [],
          personalGroups: []
        }
      ];

      companyChannels.value = [
        { id: 'chan_general', name: 'general', description: 'Company-wide chatter and updates', memberUids: ['demo_user_1', 'demo_user_2', 'demo_user_3', 'demo_user_4'] },
        { id: 'chan_dev', name: 'engineering', description: 'Code architecture, deploys, and PRs', memberUids: ['demo_user_1', 'demo_user_2'] },
        { id: 'chan_design', name: 'design-critique', description: 'Figma mockups and UI reviews', memberUids: ['demo_user_1', 'demo_user_3'] }
      ];

      // Seed sample scheduled event
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0, 0, 0);

      companyEvents.value = [
        {
          id: 'evt_all_hands',
          companyId: 'demo_company_1',
          title: 'Q3 All-Hands & Product Roadmap',
          description: 'Quarterly company review, key metrics demo, and Q&A with leadership.',
          category: window.CONSTANTS.EVENT_CATEGORIES[0],
          location: 'Voice Stage #general',
          startDate: tomorrow.toISOString(),
          durationMinutes: 60,
          hostUid: 'demo_user_1',
          hostName: 'Alice (Founder)',
          isLive: false,
          rsvps: { going: ['demo_user_1', 'demo_user_2', 'demo_user_3'], interested: ['demo_user_4'], notGoing: [] }
        }
      ];

      selectChannel(companyChannels.value[0]);
      showToast(`Logged in as ${user.displayName}`, 'success');
    };

    // ── Global Keyboard Shortcuts (Cmd+K / Ctrl+K) ─────────────
    const handleGlobalKeydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
        if (isCommandPaletteOpen.value) {
          nextTick(() => {
            const input = document.getElementById('cmdPaletteInput');
            if (input) input.focus();
          });
        }
      } else if (e.key === 'Escape' && isCommandPaletteOpen.value) {
        isCommandPaletteOpen.value = false;
      }
    };

    // ── Lifecycle onMounted ────────────────────────────────────
    onMounted(() => {
      document.documentElement.setAttribute('data-theme', theme.value);
      window.addEventListener('keydown', handleGlobalKeydown);

      window.addEventListener('online', () => {
        showToast('Internet connection restored — syncing offline queue...', 'success');
        window.fbHelper.flushOfflineQueue();
      });
      window.addEventListener('offline', () => {
        showToast('You are currently offline. Messages will queue locally.', 'info');
      });

      window.fbHelper.onAuthStateChanged(async (user) => {
        if (user) {
          let profile = await window.fbHelper.getUserProfile(user.uid);
          if (!profile) {
            profile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL || '',
              status: 'online',
              favorites: [],
              personalGroups: []
            };
          }
          currentUser.value = profile;

          if (profile.companyId) {
            await loadCompanyData(profile.companyId);
          } else {
            pendingUserInvites.value = await window.fbHelper.getPendingInvitesForEmail(user.email);
            if (pendingUserInvites.value.length === 0) {
              activeModal.value = 'createCompany';
            }
          }
        } else {
          currentUser.value = null;
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleGlobalKeydown);
      if (messagesUnsubscribe) messagesUnsubscribe();
      if (inHuddle.value) leaveHuddle();
    });

    const handleCompanyBadgeClick = () => {
      if (isOwnerOrAdmin.value) {
        activeModal.value = 'invite';
      }
    };

    const scrollToFirstPinned = () => {
      if (pinnedMessages.value.length > 0) {
        scrollToMessage(pinnedMessages.value[0].id);
      }
    };

    return {
      currentUser,
      currentCompany,
      theme,
      audioEnabled,
      notifsEnabled,
      isSidebarOpen,
      isDrawerOpen,
      isLoadingChat,
      companyUsers,
      companyChannels,
      companyInvites,
      companyEvents,
      pendingUserInvites,
      activeChat,
      messages,
      displayMessages,
      pinnedMessages,
      galleryItems,
      messageText,
      stagedAttachments,
      isUploading,
      searchQuery,
      inChatSearchQuery,
      showInChatSearch,
      isCommandPaletteOpen,
      commandSearchQuery,
      filteredCommands,
      executeCommand,
      isViewingBookmarks,
      bookmarks,
      activeReply,
      ephemeralDuration,
      isE2EEActive,
      e2eeFingerprint,
      isRecording,
      recordingDuration,
      liveTranscript,
      inHuddle,
      isMuted,
      isScreenSharing,
      huddleParticipants,
      lightboxImage,
      showSoundboardMenu,
      auditLogsList,
      kudosLeaderboard,
      activeLiveEvent,
      activeModal,
      toasts,
      authForm,
      companyForm,
      inviteForm,
      channelForm,
      personalGroupForm,
      profileForm,
      pollForm,
      showMentionPopup,
      filteredMentionUsers,
      isOwnerOrAdmin,
      favoritesList,
      directMessageUsers,
      filteredChannels,
      filteredDirectUsers,
      personalGroups,
      toggleTheme,
      toggleAudio,
      toggleNotifs,
      triggerSoundboard,
      toggleE2EE,
      openE2EEVerifyModal,
      openKudosModal,
      openKudosLeaderboardModal,
      handleSendKudos,
      handleSaveEvent,
      handleRsvpEvent,
      handleToggleLiveEvent,
      selectChannel,
      selectDirectChat,
      selectPersonalGroup,
      selectEventChat,
      openBookmarksView,
      scrollToMessage,
      scrollToFirstPinned,
      handleCompanyBadgeClick,
      handleFileSelect,
      removeStagedAttachment,
      sendMessage,
      addEmoji,
      addRandomEmoji,
      handleTextInput,
      insertMention,
      handleQuickAction,
      startVoiceRecording,
      stopAndSendVoiceRecording,
      cancelVoiceRecording,
      handleSendWhiteboardDiagram,
      handleSendVideoSnippet,
      handleReact,
      handleEditMessage,
      handleDeleteMessage,
      handleTogglePin,
      handleToggleTask,
      handleReplyTo,
      toggleBookmark,
      isMessageBookmarked,
      openPollModal,
      addPollOption,
      removePollOption,
      handleCreatePoll,
      handleVotePoll,
      openAnalyticsModal,
      openAuditModal,
      joinHuddle,
      leaveHuddle,
      toggleMute,
      toggleScreenShare,
      exportChat,
      toggleFavorite,
      isUserFavorite,
      handleCreateCompany,
      handleSendInvite,
      handleRevokeInvite,
      handleCreateChannel,
      openCreatePersonalGroupModal,
      toggleMemberSelection,
      handleSavePersonalGroup,
      deletePersonalGroup,
      openProfileModal,
      applyStatusPreset,
      handleSaveProfile,
      handleAuthSubmit,
      handleGoogleSignIn,
      handleSignOut,
      loginAsDemoUser,
      CONSTANTS: window.CONSTANTS,
      formatDuration: window.utils.formatDuration
    };
  }
});

app.mount('#app');
