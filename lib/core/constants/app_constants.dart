import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'Yapper';
  static const String version = '2.2.0';

  // User Roles
  static const String roleOwner = 'owner';
  static const String roleAdmin = 'admin';
  static const String roleMember = 'member';

  // Storage Keys
  static const String keyTheme = 'yapper_theme';
  static const String keyUser = 'yapper_user';
  static const String keyCompany = 'yapper_company';
  static const String keyBookmarks = 'yapper_bookmarks';
  static const String keyAudioEnabled = 'yapper_audio_enabled';

  // Emojis for Reactions
  static const List<String> emojiList = [
    '👍', '❤️', '🔥', '😂', '🚀', '🎉', '👀', '💯', '🙌', '💡', '✅', '⚡'
  ];

  // Ephemeral Durations (in milliseconds)
  static const List<Map<String, dynamic>> ephemeralDurations = [
    {'label': 'Off', 'value': 0},
    {'label': '1 Minute', 'value': 60 * 1000},
    {'label': '5 Minutes', 'value': 5 * 60 * 1000},
    {'label': '1 Hour', 'value': 60 * 60 * 1000},
    {'label': '24 Hours', 'value': 24 * 60 * 60 * 1000},
  ];

  // User Status Options
  static const List<Map<String, dynamic>> statusOptions = [
    {'id': 'online', 'label': 'Online', 'color': Color(0xFF10B981)},
    {'id': 'busy', 'label': 'Busy (Do Not Disturb)', 'color': Color(0xFFEF4444)},
    {'id': 'away', 'label': 'Away', 'color': Color(0xFFF59E0B)},
    {'id': 'offline', 'label': 'Offline', 'color': Color(0xFF6B7280)},
  ];

  // Event Categories
  static const List<Map<String, dynamic>> eventCategories = [
    {'id': 'townhall', 'icon': '📢', 'name': 'All Hands / Town Hall', 'color': Color(0xFF3B82F6)},
    {'id': 'techtalk', 'icon': '⚡', 'name': 'Tech Talk / Demo', 'color': Color(0xFF8B5CF6)},
    {'id': 'launch', 'icon': '🚀', 'name': 'Product Launch', 'color': Color(0xFF10B981)},
    {'id': 'social', 'icon': '🎉', 'name': 'Social / Game Night', 'color': Color(0xFFF59E0B)},
    {'id': 'hackathon', 'icon': '🧠', 'name': 'Hackathon / Sprint', 'color': Color(0xFFEC4899)},
    {'id': 'ama', 'icon': '💬', 'name': 'AMA / Q&A Session', 'color': Color(0xFF06B6D4)},
  ];

  // Kudos Badges
  static const List<Map<String, dynamic>> kudosBadges = [
    {'id': 'shipper', 'icon': '🚀', 'name': '10x Shipper', 'color': Color(0xFF3B82F6), 'desc': 'Shipped features at lightning speed'},
    {'id': 'bughunter', 'icon': '🐛', 'name': 'Bug Hunter', 'color': Color(0xFF10B981), 'desc': 'Squashed nasty bugs and fixed outages'},
    {'id': 'innovator', 'icon': '💡', 'name': 'Innovator', 'color': Color(0xFFF59E0B), 'desc': 'Pioneered creative technical solutions'},
    {'id': 'coffee', 'icon': '☕', 'name': 'Coffee Hero', 'color': Color(0xFF8B5CF6), 'desc': 'Always there to support and energize the team'},
    {'id': 'culture', 'icon': '🌟', 'name': 'Culture Champion', 'color': Color(0xFFEC4899), 'desc': 'Brought positivity and great team spirit'},
    {'id': 'brainiac', 'icon': '🧠', 'name': 'Brainiac', 'color': Color(0xFF06B6D4), 'desc': 'Solved complex architecture puzzles'},
  ];

  // Slash Commands
  static const List<Map<String, String>> slashCommands = [
    {'cmd': '/event', 'desc': 'Schedule a company event or create announcement card'},
    {'cmd': '/events', 'desc': 'Open Company Events Hub'},
    {'cmd': '/kudos @user [reason]', 'desc': 'Award a peer recognition badge and appreciation points'},
    {'cmd': '/standup', 'desc': 'Post daily async standup format (Yesterday / Today / Blockers)'},
    {'cmd': '/todo [item1, item2...]', 'desc': 'Create an interactive task checklist card'},
    {'cmd': '/poll [question]', 'desc': 'Create interactive team vote poll'},
    {'cmd': '/shrug', 'desc': 'Append ¯\\_(ツ)_/¯ to your message'},
    {'cmd': '/clear', 'desc': 'Clear in-chat search and filters'},
  ];
}
