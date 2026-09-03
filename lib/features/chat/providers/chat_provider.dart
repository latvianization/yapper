import 'package:cryptography/cryptography.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:yapper/core/services/notification_service.dart';
import 'package:yapper/core/utils/crypto_helper.dart';
import 'package:yapper/features/auth/providers/auth_provider.dart';
import 'package:yapper/features/chat/models/channel_model.dart';
import 'package:yapper/features/chat/models/message_model.dart';


class ChatState {
  final List<ChannelModel> channels;
  final ChannelModel? activeChannel;
  final List<MessageModel> messages;
  final bool isLoading;
  final bool isE2EEActive;
  final SecretKey? e2eeKey;
  final String e2eeFingerprint;
  final String searchQuery;

  const ChatState({
    this.channels = const [],
    this.activeChannel,
    this.messages = const [],
    this.isLoading = false,
    this.isE2EEActive = false,
    this.e2eeKey,
    this.e2eeFingerprint = '',
    this.searchQuery = '',
  });

  ChatState copyWith({
    List<ChannelModel>? channels,
    ChannelModel? activeChannel,
    List<MessageModel>? messages,
    bool? isLoading,
    bool? isE2EEActive,
    SecretKey? e2eeKey,
    String? e2eeFingerprint,
    String? searchQuery,
  }) {
    return ChatState(
      channels: channels ?? this.channels,
      activeChannel: activeChannel ?? this.activeChannel,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isE2EEActive: isE2EEActive ?? this.isE2EEActive,
      e2eeKey: e2eeKey ?? this.e2eeKey,
      e2eeFingerprint: e2eeFingerprint ?? this.e2eeFingerprint,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final Ref ref;
  static const _uuid = Uuid();

  ChatNotifier(this.ref) : super(const ChatState()) {
    _initDemoData();
  }

  void _initDemoData() {
    final defaultChannels = [
      const ChannelModel(
        id: 'announcements',
        name: 'announcements',
        category: 'ANNOUNCEMENTS',
        type: 'announcement',
        topic: 'Company-wide updates, roadmap releases, and executive announcements',
      ),
      const ChannelModel(
        id: 'general',
        name: 'general',
        category: 'TEXT CHANNELS',
        type: 'text',
        topic: 'General team discussion, chatter, and watercooler talk',
      ),
      const ChannelModel(
        id: 'engineering',
        name: 'engineering',
        category: 'TEXT CHANNELS',
        type: 'text',
        topic: 'Code architecture, deploys, pull requests, and bug triage',
      ),
      const ChannelModel(
        id: 'ci-builds',
        name: 'ci-builds',
        category: 'CI & ALERTS',
        type: 'text',
        topic: 'Automated CI/CD build statuses & GitHub Actions deployment webhooks',
      ),
      const ChannelModel(
        id: 'sentry-alerts',
        name: 'sentry-alerts',
        category: 'CI & ALERTS',
        type: 'text',
        topic: 'Real-time production exception alerts & error crash tracing',
      ),
      const ChannelModel(
        id: 'random',
        name: 'random',
        category: 'TEXT CHANNELS',
        type: 'text',
        topic: 'Memes, music, gaming, and casual hangouts',
      ),
      const ChannelModel(
        id: 'voice-stage',
        name: 'voice-stage',
        category: 'VOICE & HUDDLES',
        type: 'voice',
        topic: 'Drop-in live audio stage and community huddle',
      ),
    ];

    final initialMessages = [
      MessageModel(
        id: _uuid.v4(),
        channelId: 'general',
        senderId: 'user_sarah',
        senderName: 'Sarah Chen',
        text: 'Welcome to the new Flutter-powered **Yapper** workspace! 🚀 Performance across desktop and mobile is unbelievable.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
        reactions: {'🚀': ['user_alex', 'user_marcus'], '❤️': ['user_sarah']},
      ),
      MessageModel(
        id: _uuid.v4(),
        channelId: 'general',
        senderId: 'user_marcus',
        senderName: 'Marcus Vance',
        text: 'Just deployed the zero-knowledge E2EE mode and waveform voice memo support.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 20)),
        taskList: {
          'title': 'Sprint Deploy Checklist',
          'items': [
            {'text': 'Migrate Vue state to Riverpod Notifier', 'done': true, 'completedBy': 'Alex'},
            {'text': 'Implement multiplatform GoRouter shell', 'done': true, 'completedBy': 'Alex'},
            {'text': 'Verify 120Hz canvas whiteboard', 'done': false},
          ]
        },
      ),
      MessageModel(
        id: _uuid.v4(),
        channelId: 'ci-builds',
        senderId: 'webhook_github',
        senderName: 'GitHub Actions',
        senderPhotoUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        isBot: true,
        text: '🚀 **Deployment Alert**: Build #142 on branch `main` completed with status: **SUCCESS**',
        createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
        embeds: [
          {
            'title': 'CI Pipeline Succeeded: Build #142',
            'description': 'All unit tests, static analysis, and multiplatform builds passed without errors.',
            'url': 'https://github.com/your-org/yapper/actions/runs/142',
            'color': 65280, // Green
            'fields': [
              {'name': 'Branch', 'value': '`main`', 'inline': true},
              {'name': 'Commit', 'value': '`a8f23bc`', 'inline': true},
              {'name': 'Triggered By', 'value': 'Push to `main`', 'inline': true},
              {'name': 'Environment', 'value': 'Production (Web, Android, iOS, Desktop)', 'inline': false},
            ],
            'footer': {
              'text': 'Yapper CI/CD Integration',
              'iconUrl': 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            },
            'timestamp': DateTime.now().subtract(const Duration(minutes: 10)).toIso8601String(),
          }
        ],
      ),
    ];


    state = state.copyWith(
      channels: defaultChannels,
      activeChannel: defaultChannels.first,
      messages: initialMessages,
    );
    notificationService.setActiveChannel(defaultChannels.first.id);
  }

  void selectChannel(ChannelModel channel) {
    state = state.copyWith(activeChannel: channel);
    notificationService.setActiveChannel(channel.id);
  }

  Future<void> receiveIncomingMessage(MessageModel message) async {
    state = state.copyWith(messages: [...state.messages, message]);
    final currentUserId = ref.read(authProvider).user?.uid ?? '';
    final channel = state.channels.firstWhere(
      (c) => c.id == message.channelId,
      orElse: () => ChannelModel(id: message.channelId, name: message.channelId),
    );

    await notificationService.handleIncomingMessage(
      messageId: message.id,
      channelId: message.channelId,
      channelName: channel.name,
      senderId: message.senderId,
      senderName: message.senderName,
      currentUserId: currentUserId,
      messageText: message.text,
    );
  }

  Future<void> toggleE2EE(String passphrase) async {
    if (state.isE2EEActive) {
      state = state.copyWith(
        isE2EEActive: false,
        e2eeKey: null,
        e2eeFingerprint: '',
      );
      return;
    }

    final key = await CryptoHelper.deriveKey(passphrase, 'yapper_salt_${state.activeChannel?.id ?? "general"}');
    final fingerprint = await CryptoHelper.getSafetyFingerprint(key);

    state = state.copyWith(
      isE2EEActive: true,
      e2eeKey: key,
      e2eeFingerprint: fingerprint,
    );
  }

  Future<void> sendMessage({
    required String text,
    Map<String, dynamic>? replyTo,
    Map<String, dynamic>? kudos,
    Map<String, dynamic>? eventCard,
    Map<String, dynamic>? taskList,
    Map<String, dynamic>? poll,
    List<Map<String, dynamic>> attachments = const [],
    int ephemeralDuration = 0,
  }) async {
    final user = ref.read(authProvider).user;
    if (user == null || state.activeChannel == null) return;

    String finalText = text;
    String? encryptedPayload;
    bool isEncrypted = false;

    if (state.isE2EEActive && state.e2eeKey != null) {
      encryptedPayload = await CryptoHelper.encrypt(text, state.e2eeKey!);
      finalText = '🔒 [End-to-End Encrypted Message]';
      isEncrypted = true;
    }

    final newMessage = MessageModel(
      id: _uuid.v4(),
      channelId: state.activeChannel!.id,
      senderId: user.uid,
      senderName: user.displayName,
      senderPhotoUrl: user.photoUrl,
      text: finalText,
      createdAt: DateTime.now(),
      isE2EE: isEncrypted,
      encryptedPayload: encryptedPayload,
      replyTo: replyTo,
      kudos: kudos,
      eventCard: eventCard,
      taskList: taskList,
      poll: poll,
      attachments: attachments,
      ephemeralExpiresAt: ephemeralDuration > 0
          ? DateTime.now().millisecondsSinceEpoch + ephemeralDuration
          : 0,
    );

    state = state.copyWith(
      messages: [...state.messages, newMessage],
    );
  }

  void toggleReaction(String messageId, String emoji) {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId) return m;

      final currentReactions = Map<String, List<String>>.from(m.reactions);
      final usersForEmoji = List<String>.from(currentReactions[emoji] ?? []);

      if (usersForEmoji.contains(user.uid)) {
        usersForEmoji.remove(user.uid);
        if (usersForEmoji.isEmpty) {
          currentReactions.remove(emoji);
        } else {
          currentReactions[emoji] = usersForEmoji;
        }
      } else {
        usersForEmoji.add(user.uid);
        currentReactions[emoji] = usersForEmoji;
      }

      return m.copyWith(reactions: currentReactions);
    }).toList();

    state = state.copyWith(messages: updated);
  }

  void toggleTaskItem(String messageId, int itemIndex) {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId || m.taskList == null) return m;

      final taskListMap = Map<String, dynamic>.from(m.taskList!);
      final items = List<Map<String, dynamic>>.from(taskListMap['items'] ?? []);

      if (itemIndex < items.length) {
        final current = items[itemIndex];
        final isDone = !(current['done'] as bool? ?? false);
        items[itemIndex] = {
          ...current,
          'done': isDone,
          'completedBy': isDone ? user.displayName : null,
        };
      }

      taskListMap['items'] = items;
      return m.copyWith(taskList: taskListMap);
    }).toList();

    state = state.copyWith(messages: updated);
  }

  void votePoll(String messageId, int optionIndex) {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId || m.poll == null) return m;

      final pollMap = Map<String, dynamic>.from(m.poll!);
      final options = List<Map<String, dynamic>>.from(pollMap['options'] ?? []);

      for (int i = 0; i < options.length; i++) {
        final votes = List<String>.from(options[i]['votes'] ?? []);
        if (i == optionIndex) {
          if (!votes.contains(user.uid)) votes.add(user.uid);
        } else {
          votes.remove(user.uid);
        }
        options[i] = {...options[i], 'votes': votes};
      }

      pollMap['options'] = options;
      return m.copyWith(poll: pollMap);
    }).toList();

    state = state.copyWith(messages: updated);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref);
});

final currentChannelMessagesProvider = Provider<List<MessageModel>>((ref) {
  final chatState = ref.watch(chatProvider);
  final activeId = chatState.activeChannel?.id;
  final query = chatState.searchQuery.toLowerCase().trim();

  return chatState.messages.where((m) {
    final matchesChannel = m.channelId == activeId;
    if (!matchesChannel) return false;
    if (query.isEmpty) return true;
    return m.text.toLowerCase().contains(query) ||
        m.senderName.toLowerCase().contains(query);
  }).toList();
});
