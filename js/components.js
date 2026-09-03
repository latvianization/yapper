// Modern Vue 3 Components for Yapper

// Shimmer Skeleton Loader Component
const SkeletonChat = {
  name: 'SkeletonChat',
  template: `
    <div class="skeleton-feed">
      <div v-for="i in 5" :key="i" class="skeleton-row">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line w-30"></div>
          <div class="skeleton-line" :class="i % 2 === 0 ? 'w-80' : 'w-50'"></div>
        </div>
      </div>
    </div>
  `
};

// User Avatar Component
const UserAvatar = {
  name: 'UserAvatar',
  props: {
    user: { type: Object, default: () => ({}) },
    name: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    status: { type: String, default: '' },
    size: { type: String, default: 'md' },
    showStatus: { type: Boolean, default: true }
  },
  computed: {
    displayName() {
      return this.user?.displayName || this.name || 'User';
    },
    avatarUrl() {
      return this.user?.photoURL || this.photoUrl || '';
    },
    userStatus() {
      return this.user?.status || this.status || '';
    },
    initials() {
      return window.utils.getInitials(this.displayName);
    },
    bgStyle() {
      if (this.avatarUrl) return {};
      return { background: window.utils.getAvatarGradient(this.displayName) };
    },
    sizeClass() {
      if (this.size === 'sm') return 'avatar-sm';
      if (this.size === 'lg') return 'avatar-lg';
      if (this.size === 'xl') return 'avatar-xl';
      return '';
    }
  },
  template: `
    <div class="user-avatar-wrap">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" class="user-avatar" :class="sizeClass" />
      <div v-else class="user-avatar" :class="sizeClass" :style="bgStyle">
        {{ initials }}
      </div>
      <span v-if="showStatus && userStatus" class="status-dot" :class="userStatus" :title="userStatus"></span>
    </div>
  `
};

// Custom Waveform Audio Player Component (with 1x / 1.25x / 1.5x / 2x speed controls)
const CustomAudioPlayer = {
  name: 'CustomAudioPlayer',
  props: {
    src: { type: String, required: true },
    title: { type: String, default: 'Voice Memo' }
  },
  data() {
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      speeds: [1.0, 1.25, 1.5, 2.0],
      speedIndex: 0,
      peaks: [18, 35, 60, 45, 80, 95, 70, 50, 85, 100, 65, 40, 55, 90, 75, 45, 60, 80, 50, 30, 40, 70, 90, 60, 45, 20]
    };
  },
  mounted() {
    this.audio = this.$refs.audioEl;
    if (this.audio) {
      this.audio.addEventListener('timeupdate', () => {
        this.currentTime = this.audio.currentTime;
      });
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration = this.audio.duration;
      });
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
      });
    }
  },
  methods: {
    togglePlay() {
      if (!this.audio) return;
      if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
      } else {
        this.audio.playbackRate = this.playbackRate;
        this.audio.play();
        this.isPlaying = true;
      }
    },
    cycleSpeed() {
      this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
      this.playbackRate = this.speeds[this.speedIndex];
      if (this.audio) {
        this.audio.playbackRate = this.playbackRate;
      }
    },
    seek(index) {
      if (!this.audio || !this.duration) return;
      const progress = index / this.peaks.length;
      this.audio.currentTime = progress * this.duration;
    },
    isPeakActive(index) {
      if (!this.duration) return false;
      const progress = this.currentTime / this.duration;
      return (index / this.peaks.length) <= progress;
    }
  },
  template: `
    <div class="custom-audio-player">
      <audio ref="audioEl" :src="src" preload="metadata" style="display: none;"></audio>
      
      <button class="audio-play-btn" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Play'">
        <i class="fa-solid" :class="isPlaying ? 'fa-pause' : 'fa-play'"></i>
      </button>

      <div class="audio-waveform-wrap">
        <div class="audio-waveform-peaks">
          <div 
            v-for="(peak, idx) in peaks" 
            :key="idx" 
            class="waveform-bar"
            :class="{ active: isPeakActive(idx) }"
            :style="{ height: peak + '%' }"
            @click="seek(idx)"
          ></div>
        </div>
        <div class="audio-time-row">
          <span>{{ window.utils.formatDuration(currentTime) }}</span>
          <span>{{ duration ? window.utils.formatDuration(duration) : '0:00' }}</span>
        </div>
      </div>

      <button class="audio-speed-btn" @click="cycleSpeed" title="Cycle playback speed">
        {{ playbackRate }}x
      </button>
    </div>
  `
};

// Media Attachment Preview Component
const MediaPreview = {
  name: 'MediaPreview',
  components: { CustomAudioPlayer },
  props: {
    attachment: { type: Object, required: true }
  },
  emits: ['open-lightbox'],
  methods: {
    formatSize(bytes) {
      return window.utils.formatFileSize(bytes);
    },
    onImageClick() {
      this.$emit('open-lightbox', this.attachment.url);
    }
  },
  template: `
    <div class="media-preview-container">
      <img v-if="attachment.type === 'image'" 
           :src="attachment.url" 
           :alt="attachment.name" 
           class="media-image-preview" 
           @click="onImageClick"
           title="Click to expand" />

      <video v-else-if="attachment.type === 'video'" 
             :src="attachment.url" 
             controls 
             class="media-video-player"
             preload="metadata">
        Your browser does not support HTML5 video.
      </video>

      <custom-audio-player 
        v-else-if="attachment.type === 'audio'"
        :src="attachment.url"
        :title="attachment.name"
      ></custom-audio-player>

      <a v-else 
         :href="attachment.url" 
         :download="attachment.name" 
         target="_blank" 
         class="file-attachment-card">
        <i class="fa-solid fa-file-lines file-icon"></i>
        <div class="file-details">
          <span class="file-name">{{ attachment.name }}</span>
          <span class="file-size">{{ formatSize(attachment.size) }}</span>
        </div>
        <i class="fa-solid fa-arrow-down ms-auto text-dim"></i>
      </a>
    </div>
  `
};

// Celebratory Peer Kudos Card Component
const KudosCard = {
  name: 'KudosCard',
  props: {
    kudos: { type: Object, required: true }
  },
  template: `
    <div class="kudos-card">
      <div class="kudos-header">
        <div class="kudos-badge-icon" :style="{ background: kudos.badge.color || '#3b82f6' }">
          {{ kudos.badge.icon }}
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent-light); font-weight: 700;">
            Peer Recognition
          </span>
          <strong style="font-size: 0.95rem; color: #ffffff;">
            {{ kudos.badge.name }}
          </strong>
        </div>
      </div>

      <div class="kudos-body">
        <p class="kudos-reason">"{{ kudos.reason }}"</p>
      </div>

      <div class="kudos-footer">
        <span>Awarded to <strong>@{{ kudos.recipientName }}</strong> by {{ kudos.senderName }}</span>
      </div>
    </div>
  `
};

// Interactive Event Card Component (Discord-style)
const EventCard = {
  name: 'EventCard',
  props: {
    event: { type: Object, required: true },
    currentUserId: { type: String, required: true }
  },
  emits: ['rsvp', 'open-event-chat', 'download-ics'],
  computed: {
    formattedDate() {
      return window.utils.formatEventDateTime(this.event.startDate);
    },
    goingCount() {
      return this.event.rsvps?.going?.length || 0;
    },
    interestedCount() {
      return this.event.rsvps?.interested?.length || 0;
    },
    userRsvp() {
      if (this.event.rsvps?.going?.includes(this.currentUserId)) return 'going';
      if (this.event.rsvps?.interested?.includes(this.currentUserId)) return 'interested';
      if (this.event.rsvps?.notGoing?.includes(this.currentUserId)) return 'notGoing';
      return null;
    }
  },
  methods: {
    downloadICS() {
      window.utils.generateICSFile(this.event);
    }
  },
  template: `
    <div class="event-chat-card" :class="{ 'event-live-card': event.isLive }">
      <div class="event-card-top">
        <div class="event-badge-icon" :style="{ background: event.category?.color || '#3b82f6' }">
          {{ event.category?.icon || '📅' }}
        </div>
        <div style="flex: 1; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge" :style="{ background: (event.category?.color || '#3b82f6') + '25', color: event.category?.color || '#3b82f6' }">
              {{ event.category?.name || 'Company Event' }}
            </span>
            <span v-if="event.isLive" class="badge badge-live fa-beat">
              🔴 LIVE NOW
            </span>
          </div>
          <h4 class="event-title">{{ event.title }}</h4>
          <div class="event-datetime">
            <i class="fa-regular fa-calendar me-1"></i> {{ formattedDate }} ({{ event.durationMinutes || 60 }} mins)
          </div>
          <div class="event-location">
            <i class="fa-solid fa-location-dot me-1 text-primary"></i> {{ event.location || 'Voice Huddle Stage' }}
          </div>
        </div>
      </div>

      <p v-if="event.description" class="event-desc">{{ event.description }}</p>

      <div class="event-card-actions">
        <div class="rsvp-buttons">
          <button 
            class="btn btn-rsvp" 
            :class="{ active: userRsvp === 'going' }"
            @click="$emit('rsvp', { eventId: event.id, status: 'going' })"
          >
            <i class="fa-solid fa-circle-check text-success"></i> Going ({{ goingCount }})
          </button>

          <button 
            class="btn btn-rsvp" 
            :class="{ active: userRsvp === 'interested' }"
            @click="$emit('rsvp', { eventId: event.id, status: 'interested' })"
          >
            <i class="fa-solid fa-star text-warning"></i> Interested ({{ interestedCount }})
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
          <button class="icon-btn" @click="downloadICS" title="Add to Calendar (.ics)">
            <i class="fa-solid fa-calendar-plus text-dim"></i>
          </button>

          <button class="btn btn-primary" style="font-size: 0.78rem; padding: 4px 10px;" @click="$emit('open-event-chat', event)">
            <i class="fa-solid fa-comments me-1"></i> Event Chat
          </button>
        </div>
      </div>
    </div>
  `
};

// Interactive Task Checklist Card Component
const TaskChecklistCard = {
  name: 'TaskChecklistCard',
  props: {
    taskList: { type: Object, required: true },
    currentUserId: { type: String, required: true }
  },
  emits: ['toggle-item'],
  computed: {
    completedCount() {
      return this.taskList.items.filter(i => i.done).length;
    },
    totalCount() {
      return this.taskList.items.length;
    },
    progressPercent() {
      if (this.totalCount === 0) return 0;
      return Math.round((this.completedCount / this.totalCount) * 100);
    }
  },
  template: `
    <div class="task-card">
      <div class="task-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-list-check text-success"></i>
          <span style="font-weight: 700; font-size: 0.9rem;">{{ taskList.title }}</span>
        </div>
        <span class="badge" style="font-size: 0.72rem; background: var(--bg-surface-2); padding: 2px 8px; border-radius: 99px;">
          {{ completedCount }}/{{ totalCount }}
        </span>
      </div>

      <div class="task-progress-wrap">
        <div class="task-progress-bar" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <div class="task-items-list">
        <div 
          v-for="(item, idx) in taskList.items" 
          :key="idx" 
          class="task-item-row"
          :class="{ 'task-done': item.done }"
          @click="$emit('toggle-item', idx)"
        >
          <div class="task-checkbox" :class="{ checked: item.done }">
            <i v-if="item.done" class="fa-solid fa-check"></i>
          </div>
          <span class="task-item-text">{{ item.text }}</span>
          <span v-if="item.completedBy" class="task-completed-tag">by {{ item.completedBy }}</span>
        </div>
      </div>
    </div>
  `
};

// Interactive Poll Card Component
const PollCard = {
  name: 'PollCard',
  props: {
    poll: { type: Object, required: true },
    currentUserId: { type: String, required: true }
  },
  emits: ['vote'],
  computed: {
    totalVotes() {
      return this.poll.options.reduce((sum, opt) => sum + (opt.voterUids?.length || 0), 0);
    }
  },
  methods: {
    getOptionPercentage(opt) {
      if (this.totalVotes === 0) return 0;
      const count = opt.voterUids?.length || 0;
      return Math.round((count / this.totalVotes) * 100);
    },
    hasVotedOption(opt) {
      return (opt.voterUids || []).includes(this.currentUserId);
    },
    castVote(optionIndex) {
      this.$emit('vote', optionIndex);
    }
  },
  template: `
    <div class="poll-card">
      <div class="poll-question">
        <i class="fa-solid fa-chart-simple text-primary"></i>
        <span>{{ poll.question }}</span>
      </div>
      <div class="poll-options" style="display: flex; flex-direction: column; gap: 6px;">
        <div 
          v-for="(opt, idx) in poll.options" 
          :key="idx" 
          class="poll-option"
          :class="{ voted: hasVotedOption(opt) }"
          @click="castVote(idx)"
        >
          <div class="poll-fill-bar" :style="{ width: getOptionPercentage(opt) + '%' }"></div>
          <div class="poll-option-text">
            <i v-if="hasVotedOption(opt)" class="fa-solid fa-circle-check text-primary me-1"></i>
            {{ opt.text }}
          </div>
          <div class="poll-option-count">
            {{ getOptionPercentage(opt) }}% ({{ opt.voterUids?.length || 0 }})
          </div>
        </div>
      </div>
      <div style="font-size: 0.72rem; color: var(--text-dim); display: flex; justify-content: space-between;">
        <span>{{ totalVotes }} {{ totalVotes === 1 ? 'vote' : 'votes' }}</span>
        <span>Click option to vote</span>
      </div>
    </div>
  `
};

// Message Bubble Component
const MessageBubble = {
  name: 'MessageBubble',
  components: { UserAvatar, MediaPreview, PollCard, TaskChecklistCard, KudosCard, EventCard },
  props: {
    message: { type: Object, required: true },
    currentUserId: { type: String, required: true },
    isBookmarked: { type: Boolean, default: false }
  },
  emits: ['open-lightbox', 'reply', 'react', 'edit', 'delete', 'toggle-pin', 'toggle-bookmark', 'vote-poll', 'toggle-task', 'rsvp-event', 'open-event-chat', 'scroll-to-message'],
  data() {
    return {
      isEditing: false,
      editText: this.message.text || '',
      timeLeft: ''
    };
  },
  computed: {
    isOutgoing() {
      return this.message.senderId === this.currentUserId;
    },
    formattedTime() {
      return window.utils.formatTime(this.message.timestamp);
    },
    renderedMarkdown() {
      return window.utils.parseMarkdown(this.message.text);
    },
    reactionList() {
      if (!this.message.reactions) return [];
      return Object.entries(this.message.reactions).map(([emoji, users]) => ({
        emoji,
        users,
        count: users.length,
        hasReacted: users.some(u => u.uid === this.currentUserId)
      }));
    }
  },
  mounted() {
    this.updateEphemeralCountdown();
    if (this.message.expiresAt) {
      this.timerInterval = setInterval(this.updateEphemeralCountdown, 1000);
    }
  },
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  },
  methods: {
    updateEphemeralCountdown() {
      if (!this.message.expiresAt) return;
      const diff = this.message.expiresAt - Date.now();
      if (diff <= 0) {
        this.timeLeft = 'Expiring...';
      } else {
        const secs = Math.floor((diff / 1000) % 60);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        if (hrs > 0) this.timeLeft = `${hrs}h ${mins}m`;
        else if (mins > 0) this.timeLeft = `${mins}m ${secs}s`;
        else this.timeLeft = `${secs}s`;
      }
    },
    saveEdit() {
      if (this.editText.trim() && this.editText !== this.message.text) {
        this.$emit('edit', { messageId: this.message.id, text: this.editText.trim() });
      }
      this.isEditing = false;
    },
    cancelEdit() {
      this.editText = this.message.text || '';
      this.isEditing = false;
    }
  },
  template: `
    <div :id="'msg_' + message.id" class="message-row" :class="isOutgoing ? 'message-out' : 'message-in'">
      <user-avatar 
        v-if="!isOutgoing" 
        :name="message.senderName" 
        :photo-url="message.senderPhoto" 
        size="sm" 
        :show-status="false"
      ></user-avatar>
      
      <div class="message-bubble-wrap">
        <div style="display: flex; align-items: center; gap: 6px;" :style="{ justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }">
          <span v-if="!isOutgoing" class="message-sender">{{ message.senderName }}</span>
          
          <!-- E2EE Lock Tag -->
          <span v-if="message.isE2EE" class="badge badge-e2ee" title="End-to-End Encrypted">
            <i class="fa-solid fa-lock me-1"></i>E2EE
          </span>

          <!-- Ephemeral Self-Destruct Tag -->
          <span v-if="message.expiresAt" class="badge badge-ephemeral" title="Self-destructing message">
            <i class="fa-solid fa-fire fa-beat me-1"></i>{{ timeLeft }}
          </span>

          <!-- Pinned Tag -->
          <span v-if="message.isPinned" class="badge badge-pinned">
            <i class="fa-solid fa-thumbtack me-1"></i>Pinned
          </span>
        </div>

        <!-- Quoted Reply Context -->
        <div 
          v-if="message.replyTo" 
          class="reply-quote-preview"
          @click="$emit('scroll-to-message', message.replyTo.id)"
          title="Jump to quoted message"
        >
          <i class="fa-solid fa-reply fa-rotate-180 text-dim"></i>
          <span><strong>{{ message.replyTo.senderName }}:</strong> {{ message.replyTo.text.substring(0, 50) }}...</span>
        </div>
        
        <div class="message-bubble">
          <!-- Normal Text View -->
          <div v-if="!isEditing && message.text" class="message-text" v-html="renderedMarkdown"></div>

          <!-- Discord-style Event Card -->
          <event-card 
            v-if="message.event" 
            :event="message.event"
            :current-user-id="currentUserId"
            @rsvp="$emit('rsvp-event', $event)"
            @open-event-chat="$emit('open-event-chat', $event)"
          ></event-card>

          <!-- Peer Kudos Recognition Card -->
          <kudos-card v-if="message.kudos" :kudos="message.kudos"></kudos-card>

          <!-- Speech-to-Text Live Transcript -->
          <div v-if="message.transcript" class="speech-transcript-box">
            <i class="fa-solid fa-closed-captioning text-accent me-1"></i>
            <span><em>"{{ message.transcript }}"</em></span>
          </div>

          <!-- Inline Edit Input -->
          <div v-if="isEditing" style="display: flex; flex-direction: column; gap: 6px; min-width: 240px;">
            <textarea v-model="editText" class="form-control" style="font-size: 0.88rem; min-height: 50px;" rows="2"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              <button class="btn btn-secondary" style="font-size: 0.72rem; padding: 2px 8px;" @click="cancelEdit">Cancel</button>
              <button class="btn btn-primary" style="font-size: 0.72rem; padding: 2px 8px;" @click="saveEdit">Save</button>
            </div>
          </div>

          <!-- Poll Card -->
          <poll-card 
            v-if="message.poll" 
            :poll="message.poll" 
            :current-user-id="currentUserId"
            @vote="$emit('vote-poll', { messageId: message.id, optionIndex: $event })"
          ></poll-card>

          <!-- Task Checklist Card -->
          <task-checklist-card 
            v-if="message.taskList" 
            :task-list="message.taskList" 
            :current-user-id="currentUserId"
            @toggle-item="$emit('toggle-task', { messageId: message.id, itemIndex: $event })"
          ></task-checklist-card>

          <!-- Attachments -->
          <div v-if="message.attachments && message.attachments.length" class="message-attachments">
            <media-preview 
              v-for="(att, idx) in message.attachments" 
              :key="idx" 
              :attachment="att"
              @open-lightbox="$emit('open-lightbox', $event)"
            ></media-preview>
          </div>

          <div class="message-meta">
            <span v-if="message.editedAt" class="edited-tag">(edited)</span>
            <span>{{ formattedTime }}</span>
            <i v-if="isOutgoing" class="fa-solid fa-check-double ms-1" style="font-size: 0.65rem;"></i>
          </div>
        </div>

        <!-- Reaction Pills -->
        <div v-if="reactionList.length > 0" class="message-reactions">
          <button 
            v-for="r in reactionList" 
            :key="r.emoji" 
            class="reaction-pill"
            :class="{ 'reacted-by-me': r.hasReacted }"
            @click="$emit('react', { messageId: message.id, emoji: r.emoji })"
            :title="r.users.map(u => u.name).join(', ')"
          >
            <span>{{ r.emoji }}</span>
            <span style="font-size: 0.72rem; font-weight: 600;">{{ r.count }}</span>
          </button>
        </div>
      </div>

      <!-- Springy Hover Action Bar -->
      <div class="message-action-bar">
        <button class="action-bar-btn" @click="$emit('react', { messageId: message.id, emoji: '👍' })" title="Thumbs Up">👍</button>
        <button class="action-bar-btn" @click="$emit('react', { messageId: message.id, emoji: '❤️' })" title="Heart">❤️</button>
        <button class="action-bar-btn" @click="$emit('react', { messageId: message.id, emoji: '🔥' })" title="Fire">🔥</button>
        <button class="action-bar-btn" @click="$emit('react', { messageId: message.id, emoji: '😂' })" title="Laugh">😂</button>

        <button class="action-bar-btn" @click="$emit('reply', message)" title="Reply">
          <i class="fa-solid fa-reply"></i>
        </button>

        <button class="action-bar-btn" @click="$emit('toggle-pin', message)" :title="message.isPinned ? 'Unpin' : 'Pin'">
          <i class="fa-solid fa-thumbtack" :class="{ 'text-primary': message.isPinned }"></i>
        </button>

        <button class="action-bar-btn" @click="$emit('toggle-bookmark', message)" :title="isBookmarked ? 'Remove Bookmark' : 'Bookmark'">
          <i class="fa-solid fa-bookmark" :class="{ 'text-warning': isBookmarked }"></i>
        </button>

        <button v-if="isOutgoing" class="action-bar-btn" @click="isEditing = true" title="Edit">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>

        <button v-if="isOutgoing" class="action-bar-btn" @click="$emit('delete', message.id)" title="Delete" style="color: var(--danger);">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `
};

// Discord-style Company Events Hub Modal
const EventsHubModal = {
  name: 'EventsHubModal',
  props: {
    events: { type: Array, required: true },
    currentUserId: { type: String, required: true },
    isHostOrAdmin: { type: Boolean, default: false }
  },
  emits: ['close', 'create-event-click', 'open-event-chat', 'toggle-live', 'rsvp'],
  computed: {
    upcomingEvents() {
      return this.events.filter(e => !e.isPast);
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 680px;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-calendar-days text-primary"></i>
            <h3 class="modal-title">Company Scheduled Events</h3>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-primary" style="font-size: 0.78rem; padding: 4px 10px;" @click="$emit('create-event-click')">
              <i class="fa-solid fa-plus me-1"></i> Schedule Event
            </button>
            <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div class="modal-body" style="max-height: 480px; overflow-y: auto;">
          <div v-if="events.length === 0" style="text-align: center; color: var(--text-dim); padding: 40px 0;">
            <i class="fa-solid fa-calendar-plus" style="font-size: 2.2rem; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
            <p>No company events scheduled yet.</p>
            <button class="btn btn-secondary mt-3" @click="$emit('create-event-click')">Schedule your team's first event</button>
          </div>

          <div v-else style="display: flex; flex-direction: column; gap: 14px;">
            <div 
              v-for="ev in events" 
              :key="ev.id" 
              class="events-hub-item"
              :class="{ 'event-hub-live': ev.isLive }"
            >
              <div class="event-badge-icon" :style="{ background: ev.category?.color || '#3b82f6' }">
                {{ ev.category?.icon || '📅' }}
              </div>

              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge" :style="{ background: (ev.category?.color || '#3b82f6') + '25', color: ev.category?.color || '#3b82f6' }">
                    {{ ev.category?.name || 'Company Event' }}
                  </span>
                  <span v-if="ev.isLive" class="badge badge-live fa-beat">🔴 LIVE NOW</span>
                </div>
                <h4 style="font-size: 1.05rem; font-weight: 750; color: #fff; margin-top: 4px;">{{ ev.title }}</h4>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  <i class="fa-regular fa-calendar me-1"></i> {{ window.utils.formatEventDateTime(ev.startDate) }} • <i class="fa-solid fa-location-dot me-1"></i> {{ ev.location || 'Voice Huddle Stage' }}
                </div>
                <p v-if="ev.description" style="font-size: 0.82rem; color: var(--text-dim); margin-top: 6px;">{{ ev.description }}</p>

                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                  <span style="font-size: 0.76rem; color: var(--text-dim);">
                    <strong>{{ ev.rsvps?.going?.length || 0 }}</strong> Going • <strong>{{ ev.rsvps?.interested?.length || 0 }}</strong> Interested
                  </span>

                  <button 
                    v-if="isHostOrAdmin || ev.hostUid === currentUserId" 
                    class="btn" 
                    :class="ev.isLive ? 'btn-danger' : 'btn-secondary'"
                    style="font-size: 0.72rem; padding: 2px 8px; margin-left: auto;"
                    @click="$emit('toggle-live', { eventId: ev.id, isLive: !ev.isLive })"
                  >
                    {{ ev.isLive ? 'End Live Stage' : '🔴 Go Live' }}
                  </button>

                  <button class="btn btn-primary" style="font-size: 0.72rem; padding: 2px 8px;" @click="$emit('open-event-chat', ev)">
                    <i class="fa-solid fa-comments me-1"></i> Event Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  `
};

// Create Event Modal Component
const CreateEventModal = {
  name: 'CreateEventModal',
  emits: ['close', 'save-event'],
  data() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);

    return {
      title: '',
      description: '',
      category: window.CONSTANTS.EVENT_CATEGORIES[0],
      location: 'Voice Huddle Stage',
      startDate: tomorrow.toISOString().slice(0, 16),
      durationMinutes: 60,
      postToActiveChannel: true,
      categories: window.CONSTANTS.EVENT_CATEGORIES
    };
  },
  methods: {
    submitEvent() {
      if (!this.title.trim() || !this.startDate) return;
      this.$emit('save-event', {
        title: this.title.trim(),
        description: this.description.trim(),
        category: this.category,
        location: this.location.trim(),
        startDate: this.startDate,
        durationMinutes: parseInt(this.durationMinutes) || 60,
        postToActiveChannel: this.postToActiveChannel
      });
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 520px;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-calendar-plus text-primary"></i>
            <h3 class="modal-title">Schedule Company Event</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitEvent">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Event Topic / Title</label>
              <input type="text" v-model="title" class="form-control" placeholder="e.g. Q3 All Hands Town Hall, Tech Architecture Talk" required />
            </div>

            <div class="form-group">
              <label class="form-label">Event Category</label>
              <div class="kudos-badge-selector" style="grid-template-columns: repeat(3, 1fr);">
                <div 
                  v-for="c in categories" 
                  :key="c.id" 
                  class="kudos-badge-opt"
                  :class="{ active: category.id === c.id }"
                  @click="category = c"
                >
                  <span style="font-size: 1.3rem;">{{ c.icon }}</span>
                  <strong style="font-size: 0.75rem;">{{ c.name }}</strong>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label class="form-label">Start Date &amp; Time</label>
                <input type="datetime-local" v-model="startDate" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Duration (Minutes)</label>
                <input type="number" v-model.number="durationMinutes" class="form-control" min="15" step="15" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Location / Stage</label>
              <input type="text" v-model="location" class="form-control" placeholder="Voice Huddle Stage / #general / Zoom link" />
            </div>

            <div class="form-group">
              <label class="form-label">Description &amp; Agenda</label>
              <textarea v-model="description" class="form-control" rows="3" placeholder="What will be discussed during this event?"></textarea>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
              <input type="checkbox" id="postChanCheck" v-model="postToActiveChannel" />
              <label for="postChanCheck" style="font-size: 0.82rem; color: var(--text-muted); cursor: pointer;">
                Post interactive RSVP announcement card in active channel
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="!title.trim()">
              <i class="fa-solid fa-calendar-check me-1"></i> Publish Event
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// Peer Kudos Award Modal Component
const KudosModal = {
  name: 'KudosModal',
  props: {
    users: { type: Array, required: true },
    currentUserId: { type: String, required: true }
  },
  emits: ['close', 'send-kudos'],
  data() {
    return {
      selectedUserId: this.users[0]?.uid || '',
      selectedBadgeId: window.CONSTANTS.KUDOS_BADGES[0].id,
      reason: '',
      badges: window.CONSTANTS.KUDOS_BADGES
    };
  },
  methods: {
    submitKudos() {
      const recipient = this.users.find(u => u.uid === this.selectedUserId);
      const badge = this.badges.find(b => b.id === this.selectedBadgeId);
      if (!recipient || !badge || !this.reason.trim()) return;

      this.$emit('send-kudos', {
        recipientId: recipient.uid,
        recipientName: recipient.displayName || recipient.email,
        badge,
        reason: this.reason.trim()
      });
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-award text-warning"></i>
            <h3 class="modal-title">Award Peer Kudos</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitKudos">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Select Colleague</label>
              <select v-model="selectedUserId" class="form-control" required>
                <option v-for="u in users" :key="u.uid" :value="u.uid">
                  {{ u.displayName || u.email }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Choose Recognition Badge</label>
              <div class="kudos-badge-selector">
                <div 
                  v-for="b in badges" 
                  :key="b.id" 
                  class="kudos-badge-opt"
                  :class="{ active: selectedBadgeId === b.id }"
                  @click="selectedBadgeId = b.id"
                >
                  <span style="font-size: 1.4rem;">{{ b.icon }}</span>
                  <strong style="font-size: 0.8rem;">{{ b.name }}</strong>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Reason / Appreciation Note</label>
              <textarea 
                v-model="reason" 
                class="form-control" 
                placeholder="e.g. Thanks for jumping in and resolving the deploy blockage!" 
                rows="3" 
                required
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="!reason.trim()">
              <i class="fa-solid fa-paper-plane me-1"></i> Send Kudos
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// Kudos Leaderboard Modal Component
const KudosLeaderboardModal = {
  name: 'KudosLeaderboardModal',
  props: {
    leaderboard: { type: Array, required: true }
  },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 540px;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-trophy text-warning"></i>
            <h3 class="modal-title">Company Kudos Leaderboard</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div v-if="leaderboard.length === 0" style="text-align: center; color: var(--text-dim); padding: 30px 0;">
            No kudos awarded yet. Be the first to recognize a colleague!
          </div>

          <div v-else style="display: flex; flex-direction: column; gap: 8px;">
            <div 
              v-for="(item, idx) in leaderboard" 
              :key="idx" 
              class="leaderboard-item"
            >
              <div class="leaderboard-rank" :class="'rank-' + (idx + 1)">
                {{ idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1)) }}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.92rem;">{{ item.name }}</div>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                  <span v-for="(b, bIdx) in item.badges" :key="bIdx" :title="b.name">{{ b.icon }}</span>
                </div>
              </div>
              <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 0.85rem; padding: 4px 10px;">
                {{ item.count }} Kudos
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Done</button>
        </div>
      </div>
    </div>
  `
};

// E2EE Key Verification Modal Component
const E2EEVerifyModal = {
  name: 'E2EEVerifyModal',
  props: {
    peerName: { type: String, required: true },
    fingerprint: { type: String, required: true }
  },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 480px; text-align: center;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-lock text-warning"></i>
            <h3 class="modal-title">E2EE Safety Number</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Messages in this chat are protected by AES-GCM 256-bit client-side encryption. Compare this safety fingerprint with <strong>{{ peerName }}</strong> to verify end-to-end encryption.
          </p>

          <div class="fingerprint-box">
            <code>{{ fingerprint }}</code>
          </div>

          <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; font-size: 0.78rem; color: var(--success);">
            <i class="fa-solid fa-circle-check"></i> Zero-Knowledge Encryption Active
          </div>
        </div>

        <div class="modal-footer" style="justify-content: center;">
          <button class="btn btn-primary" @click="$emit('close')">Verified</button>
        </div>
      </div>
    </div>
  `
};

// Interactive Whiteboard & Diagram Modal Component
const WhiteboardModal = {
  name: 'WhiteboardModal',
  emits: ['close', 'send-diagram'],
  data() {
    return {
      tool: 'pen',
      color: '#3b82f6',
      lineWidth: 3,
      isDrawing: false,
      startX: 0,
      startY: 0,
      history: [],
      colors: ['#ffffff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.canvas = this.$refs.boardCanvas;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = 750;
      this.canvas.height = 450;
      this.clearCanvas();
    });
  },
  methods: {
    clearCanvas() {
      this.ctx.fillStyle = '#10121a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 1;
      for (let x = 20; x < this.canvas.width; x += 20) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      for (let y = 20; y < this.canvas.height; y += 20) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
      this.saveState();
    },
    saveState() {
      this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
      if (this.history.length > 20) this.history.shift();
    },
    undo() {
      if (this.history.length > 1) {
        this.history.pop();
        const prev = this.history[this.history.length - 1];
        this.ctx.putImageData(prev, 0, 0);
      }
    },
    startDraw(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
      this.isDrawing = true;
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      if (this.tool === 'pen' || this.tool === 'eraser') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
      }
    },
    draw(e) {
      if (!this.isDrawing) return;
      const rect = this.canvas.getBoundingClientRect();
      const currX = e.clientX - rect.left;
      const currY = e.clientY - rect.top;

      this.ctx.strokeStyle = this.tool === 'eraser' ? '#10121a' : this.color;
      this.ctx.lineWidth = this.tool === 'eraser' ? this.lineWidth * 4 : this.lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (this.tool === 'pen' || this.tool === 'eraser') {
        this.ctx.lineTo(currX, currY);
        this.ctx.stroke();
      } else {
        this.ctx.putImageData(this.snapshot, 0, 0);
        if (this.tool === 'rect') {
          this.ctx.strokeRect(this.startX, this.startY, currX - this.startX, currY - this.startY);
        } else if (this.tool === 'circle') {
          this.ctx.beginPath();
          const r = Math.sqrt(Math.pow(currX - this.startX, 2) + Math.pow(currY - this.startY, 2));
          this.ctx.arc(this.startX, this.startY, r, 0, 2 * Math.PI);
          this.ctx.stroke();
        } else if (this.tool === 'arrow') {
          this.drawArrow(this.startX, this.startY, currX, currY);
        }
      }
    },
    endDraw() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.saveState();
    },
    drawArrow(fromX, fromY, toX, toY) {
      const headlen = 12;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      this.ctx.moveTo(toX, toY);
      this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      this.ctx.stroke();
    },
    exportAndSend() {
      this.canvas.toBlob(blob => {
        const file = new File([blob], `diagram_${Date.now()}.png`, { type: 'image/png' });
        this.$emit('send-diagram', file);
      }, 'image/png');
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box whiteboard-modal-box" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-paintbrush text-primary"></i>
            <h3 class="modal-title">Interactive Whiteboard &amp; Diagrammer</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="whiteboard-toolbar">
          <div class="btn-group">
            <button class="tool-btn" :class="{ active: tool === 'pen' }" @click="tool = 'pen'" title="Pen"><i class="fa-solid fa-pen"></i></button>
            <button class="tool-btn" :class="{ active: tool === 'rect' }" @click="tool = 'rect'" title="Rectangle"><i class="fa-regular fa-square"></i></button>
            <button class="tool-btn" :class="{ active: tool === 'circle' }" @click="tool = 'circle'" title="Circle"><i class="fa-regular fa-circle"></i></button>
            <button class="tool-btn" :class="{ active: tool === 'arrow' }" @click="tool = 'arrow'" title="Arrow"><i class="fa-solid fa-arrow-right"></i></button>
            <button class="tool-btn" :class="{ active: tool === 'eraser' }" @click="tool = 'eraser'" title="Eraser"><i class="fa-solid fa-eraser"></i></button>
          </div>

          <div class="color-palette">
            <button 
              v-for="c in colors" 
              :key="c" 
              class="color-dot" 
              :style="{ background: c }"
              :class="{ active: color === c }"
              @click="color = c"
            ></button>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.72rem; color: var(--text-dim);">Size:</span>
            <input type="range" v-model.number="lineWidth" min="1" max="10" style="width: 70px;" />
          </div>

          <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" @click="undo" title="Undo"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" @click="clearCanvas" title="Clear Canvas"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>

        <div class="canvas-wrapper">
          <canvas 
            ref="boardCanvas"
            @mousedown="startDraw"
            @mousemove="draw"
            @mouseup="endDraw"
            @mouseleave="endDraw"
          ></canvas>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="exportAndSend">
            <i class="fa-solid fa-paper-plane me-1"></i> Post Diagram to Chat
          </button>
        </div>
      </div>
    </div>
  `
};

// Quick Video Snippet Modal Component
const VideoRecordModal = {
  name: 'VideoRecordModal',
  emits: ['close', 'send-video'],
  data() {
    return {
      stream: null,
      mediaRecorder: null,
      recordedChunks: [],
      isRecording: false,
      recordingDuration: 0,
      timer: null,
      recordedBlob: null,
      previewUrl: ''
    };
  },
  async mounted() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.$refs.videoPreview.srcObject = this.stream;
    } catch (err) {
      alert("Camera / Microphone permission denied or unavailable.");
      this.$emit('close');
    }
  },
  beforeUnmount() {
    this.stopStream();
  },
  methods: {
    stopStream() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
      if (this.timer) clearInterval(this.timer);
    },
    startRecording() {
      this.recordedChunks = [];
      this.recordedBlob = null;
      this.previewUrl = '';
      this.recordingDuration = 0;

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.previewUrl = URL.createObjectURL(this.recordedBlob);
        this.$refs.videoPreview.srcObject = null;
        this.$refs.videoPreview.src = this.previewUrl;
        this.$refs.videoPreview.controls = true;
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.timer = setInterval(() => {
        this.recordingDuration++;
        if (this.recordingDuration >= 60) this.stopRecording();
      }, 1000);
    },
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
        clearInterval(this.timer);
      }
    },
    retake() {
      this.recordedBlob = null;
      this.previewUrl = '';
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(s => {
        this.stream = s;
        this.$refs.videoPreview.src = '';
        this.$refs.videoPreview.controls = false;
        this.$refs.videoPreview.srcObject = this.stream;
      });
    },
    sendSnippet() {
      if (!this.recordedBlob) return;
      const file = new File([this.recordedBlob], `video_snippet_${Date.now()}.webm`, { type: 'video/webm' });
      this.$emit('send-video', file);
      this.stopStream();
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box video-record-box" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-video text-danger"></i>
            <h3 class="modal-title">Record Quick Video Snippet</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="video-preview-wrapper">
          <video ref="videoPreview" autoplay playsinline muted></video>
          <div v-if="isRecording" class="video-record-pill">
            <div class="recording-dot"></div>
            <span>{{ window.utils.formatDuration(recordingDuration) }} / 1:00</span>
          </div>
        </div>

        <div class="modal-footer" style="justify-content: center; gap: 12px;">
          <button v-if="!isRecording && !recordedBlob" class="btn btn-danger" style="padding: 10px 24px; font-size: 0.9rem;" @click="startRecording">
            <i class="fa-solid fa-circle me-1"></i> Start Recording
          </button>
          
          <button v-if="isRecording" class="btn btn-secondary" style="padding: 10px 24px; font-size: 0.9rem;" @click="stopRecording">
            <i class="fa-solid fa-stop me-1"></i> Stop Recording
          </button>

          <template v-if="recordedBlob">
            <button class="btn btn-secondary" @click="retake"><i class="fa-solid fa-rotate-left me-1"></i> Retake</button>
            <button class="btn btn-primary" @click="sendSnippet"><i class="fa-solid fa-paper-plane me-1"></i> Send Video Snippet</button>
          </template>
        </div>
      </div>
    </div>
  `
};

// Channel Activity & Sentiment Analytics Modal
const AnalyticsModal = {
  name: 'AnalyticsModal',
  props: {
    channelName: { type: String, required: true },
    messages: { type: Array, required: true }
  },
  emits: ['close'],
  computed: {
    stats() {
      return window.utils.analyzeChannelActivity(this.messages);
    },
    topContributors() {
      return Object.entries(this.stats.contributors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    }
  },
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 600px;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-chart-pie text-accent"></i>
            <h3 class="modal-title">#{{ channelName }} Analytics</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="analytics-grid">
            <div class="analytics-card">
              <span class="analytics-val">{{ stats.totalMessages }}</span>
              <span class="analytics-lbl">Total Messages</span>
            </div>
            <div class="analytics-card">
              <span class="analytics-val">{{ Object.keys(stats.contributors).length }}</span>
              <span class="analytics-lbl">Contributors</span>
            </div>
            <div class="analytics-card">
              <span class="analytics-val" :class="stats.sentiment.score >= 0 ? 'text-success' : 'text-danger'">
                {{ stats.sentiment.score > 0 ? '+' : '' }}{{ stats.sentiment.score }}%
              </span>
              <span class="analytics-lbl">Team Sentiment Score</span>
            </div>
          </div>

          <div class="mt-4">
            <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Top Contributors</h5>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              <div v-for="([name, count], idx) in topContributors" :key="idx" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: var(--bg-surface-2); border-radius: 8px;">
                <span style="font-size: 0.85rem; font-weight: 600;">{{ name }}</span>
                <span class="badge" style="background: var(--bg-surface-1); color: var(--accent-light);">{{ count }} msgs</span>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Media &amp; Attachments</h5>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-image text-primary me-1"></i> {{ stats.mediaCounts.images }} Photos</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-video text-danger me-1"></i> {{ stats.mediaCounts.videos }} Videos</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-microphone text-warning me-1"></i> {{ stats.mediaCounts.audios }} Audio Notes</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-chart-simple text-accent me-1"></i> {{ stats.mediaCounts.polls }} Polls</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-list-check text-success me-1"></i> {{ stats.mediaCounts.tasks }} Task Lists</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-award text-warning me-1"></i> {{ stats.mediaCounts.kudos }} Kudos</span>
              <span class="badge" style="background: var(--bg-surface-2); padding: 6px 10px;"><i class="fa-solid fa-calendar-days text-primary me-1"></i> {{ stats.mediaCounts.events }} Events</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  `
};

// Workspace Audit Log Modal Component
const AuditLogModal = {
  name: 'AuditLogModal',
  props: {
    logs: { type: Array, required: true }
  },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-dialog-box" style="max-width: 650px;" @click.stop>
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-shield-halved text-primary"></i>
            <h3 class="modal-title">Workspace Governance &amp; Audit Trail</h3>
          </div>
          <button class="icon-btn" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
          <div v-if="logs.length === 0" style="text-align: center; color: var(--text-dim); padding: 40px 0;">
            No audit events recorded yet.
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 10px;">
            <div v-for="log in logs" :key="log.id" class="audit-log-item">
              <div class="audit-log-icon">
                <i class="fa-solid fa-shield text-primary"></i>
              </div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                  <strong>{{ log.actor }}</strong>
                  <span style="font-size: 0.72rem; color: var(--text-dim);">{{ window.utils.formatTime(log.timestamp) }}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">{{ log.details }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Done</button>
        </div>
      </div>
    </div>
  `
};

window.YapperComponents = {
  SkeletonChat,
  UserAvatar,
  CustomAudioPlayer,
  MediaPreview,
  PollCard,
  TaskChecklistCard,
  KudosCard,
  EventCard,
  EventsHubModal,
  CreateEventModal,
  MessageBubble,
  KudosModal,
  KudosLeaderboardModal,
  E2EEVerifyModal,
  WhiteboardModal,
  VideoRecordModal,
  AnalyticsModal,
  AuditLogModal
};
