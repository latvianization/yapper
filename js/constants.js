// Application Constants & Configuration for Yapper

const CONSTANTS = {
  APP_NAME: "Yapper",
  VERSION: "2.2.0",

  // User Roles
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member'
  },

  // Default Channels for newly created Company Workspaces
  DEFAULT_CHANNELS: [
    { name: 'general', description: 'Company-wide updates, chatter, and announcements' },
    { name: 'engineering', description: 'Code architecture, deploys, pull requests, and bug reports' },
    { name: 'random', description: 'Memes, watercooler chats, music, and casual hangouts' }
  ],

  // User Status Options
  STATUS_OPTIONS: [
    { id: 'online', label: 'Online', color: '#10b981' },
    { id: 'busy', label: 'Busy (Do Not Disturb)', color: '#ef4444' },
    { id: 'away', label: 'Away', color: '#f59e0b' },
    { id: 'offline', label: 'Offline', color: '#6b7280' }
  ],

  // Quick Status Presets
  STATUS_PRESETS: [
    { icon: '🎧', text: 'Deep Focus / Coding', status: 'busy' },
    { icon: '🥪', text: 'Out for Lunch', status: 'away' },
    { icon: '📅', text: 'In a Meeting', status: 'busy' },
    { icon: '☕', text: 'Coffee Break', status: 'away' },
    { icon: '🌴', text: 'On Vacation / PTO', status: 'offline' }
  ],

  // Event Categories
  EVENT_CATEGORIES: [
    { id: 'townhall', icon: '📢', name: 'All Hands / Town Hall', color: '#3b82f6' },
    { id: 'techtalk', icon: '⚡', name: 'Tech Talk / Demo', color: '#8b5cf6' },
    { id: 'launch', icon: '🚀', name: 'Product Launch', color: '#10b981' },
    { id: 'social', icon: '🎉', name: 'Social / Game Night', color: '#f59e0b' },
    { id: 'hackathon', icon: '🧠', name: 'Hackathon / Sprint', color: '#ec4899' },
    { id: 'ama', icon: '💬', name: 'AMA / Q&A Session', color: '#06b6d4' }
  ],

  // Emoji Reactions List
  EMOJI_LIST: ['👍', '❤️', '🔥', '😂', '🚀', '🎉', '👀', '💯', '🙌', '💡', '✅', '⚡'],

  // Ephemeral Self-Destruct Message Durations (in ms)
  EPHEMERAL_DURATIONS: [
    { label: 'Off', value: 0 },
    { label: '1 Minute', value: 60 * 1000 },
    { label: '5 Minutes', value: 5 * 60 * 1000 },
    { label: '1 Hour', value: 60 * 60 * 1000 },
    { label: '24 Hours', value: 24 * 60 * 60 * 1000 }
  ],

  // Web Audio Soundboard Effects
  SOUNDBOARD_EFFECTS: [
    { id: 'applause', name: 'Applause', icon: 'fa-hands-clapping', tone: 'applause' },
    { id: 'tada', name: 'Tada Fanfare', icon: 'fa-champagne-glasses', tone: 'tada' },
    { id: 'chime', name: 'Success Chime', icon: 'fa-bell', tone: 'chime' },
    { id: 'drumroll', name: 'Drumroll', icon: 'fa-drum', tone: 'drumroll' },
    { id: 'buzzer', name: 'Buzzer', icon: 'fa-circle-xmark', tone: 'buzzer' },
    { id: 'victory', name: 'Victory', icon: 'fa-trophy', tone: 'victory' }
  ],

  // Kudos Badges Suite
  KUDOS_BADGES: [
    { id: 'shipper', icon: '🚀', name: '10x Shipper', color: '#3b82f6', desc: 'Shipped features at lightning speed' },
    { id: 'bughunter', icon: '🐛', name: 'Bug Hunter', color: '#10b981', desc: 'Squashed nasty bugs and fixed outages' },
    { id: 'innovator', icon: '💡', name: 'Innovator', color: '#f59e0b', desc: 'Pioneered creative technical solutions' },
    { id: 'coffee', icon: '☕', name: 'Coffee Hero', color: '#8b5cf6', desc: 'Always there to support and energize the team' },
    { id: 'culture', icon: '🌟', name: 'Culture Champion', color: '#ec4899', desc: 'Brought positivity and great team spirit' },
    { id: 'brainiac', icon: '🧠', name: 'Brainiac', color: '#06b6d4', desc: 'Solved complex architecture puzzles' }
  ],

  // Slash Commands Suite
  SLASH_COMMANDS: [
    { cmd: '/event', desc: 'Schedule a company event or create announcement card' },
    { cmd: '/events', desc: 'Open Company Events Hub' },
    { cmd: '/kudos @user [reason]', desc: 'Award a peer recognition badge and appreciation points' },
    { cmd: '/standup', desc: 'Post daily async standup format (Yesterday / Today / Blockers)' },
    { cmd: '/todo [item1, item2...]', desc: 'Create an interactive task checklist card' },
    { cmd: '/remind [minutes] [message]', desc: 'Set a browser reminder timer' },
    { cmd: '/table [cols] [rows]', desc: 'Generate a markdown data table template' },
    { cmd: '/poll [question]', desc: 'Quick open poll modal' },
    { cmd: '/shrug', desc: 'Append ¯\\_(ツ)_/¯ to your message' },
    { cmd: '/clear', desc: 'Clear in-chat search and filters' }
  ],

  // Workspace Audit Log Event Types
  AUDIT_EVENTS: {
    USER_LOGIN: 'user_login',
    USER_INVITED: 'user_invited',
    INVITE_REVOKED: 'invite_revoked',
    CHANNEL_CREATED: 'channel_created',
    ROLE_CHANGED: 'role_changed',
    MEMBER_REMOVED: 'member_removed',
    KUDOS_AWARDED: 'kudos_awarded',
    EVENT_CREATED: 'event_created',
    EVENT_STARTED: 'event_started'
  },

  // Free Google STUN Servers for WebRTC Audio Huddles
  RTC_CONFIG: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    THEME: 'yapper_theme',
    CURRENT_USER: 'yapper_user',
    AUDIO_ENABLED: 'yapper_audio',
    NOTIFS_ENABLED: 'yapper_notifs',
    BOOKMARKS: 'yapper_bookmarks',
    OFFLINE_QUEUE: 'yapper_offline_queue',
    AUDIT_LOGS: 'yapper_audit_logs',
    REMINDERS: 'yapper_reminders',
    KUDOS_STORE: 'yapper_kudos_store',
    EVENTS_STORE: 'yapper_events_store',
    E2EE_KEYS: 'yapper_e2ee_keys'
  }
};

window.CONSTANTS = CONSTANTS;
