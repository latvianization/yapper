import 'dart:convert';
import 'package:cryptography/cryptography.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/services/notification_service.dart';
import 'package:yapper/core/utils/crypto_helper.dart';
import 'package:yapper/features/auth/models/user_model.dart';
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
    bool clearActiveChannel = false,
  }) {
    return ChatState(
      channels: channels ?? this.channels,
      activeChannel: clearActiveChannel ? null : (activeChannel ?? this.activeChannel),
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
  static const String _keyChannels = 'yapper_channels_store';
  static const String _keyMessages = 'yapper_messages_store';

  List<ChannelModel> _allChannels = [];
  List<MessageModel> _allMessages = [];

  ChatNotifier(this.ref) : super(const ChatState()) {
    _initChatData();
    // Reactively update visible channels when active user/company changes
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.user?.uid != next.user?.uid || previous?.user?.companyId != next.user?.companyId) {
        _syncForUser(next.user);
      }
    });
  }

  bool canUserAccessChannel(ChannelModel channel, UserModel? user) {
    if (user == null) return false;
    // 1. Multi-tenancy check: User can only access channels within their company
    if (channel.companyId != user.companyId) return false;
    // 2. Owner permissions: Workspace owner can view all channels in their company
    if (user.role == AppConstants.roleOwner) return true;
    // 3. Public channel: Any member of this company can view
    if (!channel.isPrivate) return true;
    // 4. Restricted/private channel: Only assigned members can view
    return channel.memberUids.contains(user.uid);
  }

  Future<void> _initChatData() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Load or seed Channels
      final channelsJson = prefs.getString(_keyChannels);
      if (channelsJson != null) {
        final list = jsonDecode(channelsJson) as List<dynamic>;
        _allChannels = list.map((e) => ChannelModel.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        _allChannels = [
          // Acme Technologies (comp_acme)
          const ChannelModel(
            id: 'acme_announcements',
            name: 'announcements',
            category: 'ANNOUNCEMENTS',
            type: 'announcement',
            topic: 'Company-wide news and roadmaps',
            companyId: 'comp_acme',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'acme_general',
            name: 'general',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'General team discussion & chatter',
            companyId: 'comp_acme',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'acme_engineering',
            name: 'engineering',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'Code architecture, deploys & pull requests',
            companyId: 'comp_acme',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'acme_product',
            name: 'product',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'Product design, roadmaps & feature specs',
            companyId: 'comp_acme',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'acme_executive_confidential',
            name: 'executive-confidential',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'Owner and assigned leads strategic planning',
            companyId: 'comp_acme',
            isPrivate: true,
            memberUids: ['user_alex'], // Only Alex Rivera (Owner) assigned; Bob cannot view!
          ),

          // Stark Industries (comp_stark) - Completely separate tenant
          const ChannelModel(
            id: 'stark_announcements',
            name: 'announcements',
            category: 'ANNOUNCEMENTS',
            type: 'announcement',
            topic: 'Stark Industries executive orders',
            companyId: 'comp_stark',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'stark_general',
            name: 'general',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'Stark tech chatter & ideas',
            companyId: 'comp_stark',
            isPrivate: false,
          ),
          const ChannelModel(
            id: 'stark_iron_legion',
            name: 'iron-legion-rnd',
            category: 'TEXT CHANNELS',
            type: 'text',
            topic: 'Mark suits & defense architecture',
            companyId: 'comp_stark',
            isPrivate: true,
            memberUids: ['user_tony'], // Only Tony Stark assigned; Peter cannot view unless assigned!
          ),
        ];
        await prefs.setString(_keyChannels, jsonEncode(_allChannels.map((c) => c.toJson()).toList()));
      }

      // 2. Load or seed Messages
      final messagesJson = prefs.getString(_keyMessages);
      if (messagesJson != null) {
        final list = jsonDecode(messagesJson) as List<dynamic>;
        _allMessages = list.map((e) => MessageModel.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        _allMessages = [
          MessageModel(
            id: _uuid.v4(),
            channelId: 'acme_general',
            senderId: 'user_alex',
            senderName: 'Alex Rivera',
            text: 'Welcome to Acme Technologies workspace! 🚀 Only Acme members can see this.',
            createdAt: DateTime.now().subtract(const Duration(minutes: 60)),
          ),
          MessageModel(
            id: _uuid.v4(),
            channelId: 'acme_executive_confidential',
            senderId: 'user_alex',
            senderName: 'Alex Rivera',
            text: '🔒 [RESTRICTED] Executive Board Roadmap: Visible exclusively to Workspace Owner and assigned leads.',
            createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
          ),
          MessageModel(
            id: _uuid.v4(),
            channelId: 'stark_general',
            senderId: 'user_tony',
            senderName: 'Tony Stark',
            text: 'Welcome to Stark Industries. Zero tolerance for other company snooping.',
            createdAt: DateTime.now().subtract(const Duration(minutes: 40)),
          ),
          MessageModel(
            id: _uuid.v4(),
            channelId: 'stark_iron_legion',
            senderId: 'user_tony',
            senderName: 'Tony Stark',
            text: '🔒 [RESTRICTED] Arc Reactor & Mark 85 specifications. Strictly classified.',
            createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
          ),
        ];
        await prefs.setString(_keyMessages, jsonEncode(_allMessages.map((m) => m.toJson()).toList()));
      }

      // 3. Sync channels for active user
      final currentUser = ref.read(authProvider).user;
      _syncForUser(currentUser);
    } catch (_) {}
  }

  void _syncForUser(UserModel? user) {
    if (user == null) {
      state = state.copyWith(
        channels: [],
        clearActiveChannel: true,
        messages: [],
      );
      return;
    }

    // Filter channels: ONLY channels matching user's company that user has permission to view
    final accessibleChannels = _allChannels.where((c) => canUserAccessChannel(c, user)).toList();

    // If active channel is invalid or not accessible, switch to first accessible channel
    ChannelModel? active = state.activeChannel;
    if (active == null || !accessibleChannels.any((c) => c.id == active!.id)) {
      active = accessibleChannels.isNotEmpty ? accessibleChannels.first : null;
    }

    // Filter messages: ONLY messages belonging to accessible channels
    final accessibleChannelIds = accessibleChannels.map((c) => c.id).toSet();
    final accessibleMessages = _allMessages.where((m) => accessibleChannelIds.contains(m.channelId)).toList();

    state = state.copyWith(
      channels: accessibleChannels,
      activeChannel: active,
      messages: accessibleMessages,
    );

    if (active != null) {
      notificationService.setActiveChannel(active.id);
    }
  }

  void selectChannel(ChannelModel channel) {
    final user = ref.read(authProvider).user;
    if (!canUserAccessChannel(channel, user)) return;

    state = state.copyWith(activeChannel: channel);
    notificationService.setActiveChannel(channel.id);
  }

  Future<void> createChannel({
    required String name,
    required String category,
    String topic = '',
    bool isPrivate = false,
    List<String> memberUids = const [],
  }) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final newChannel = ChannelModel(
      id: 'chan_${DateTime.now().millisecondsSinceEpoch}',
      name: name.trim().toLowerCase().replaceAll(' ', '-'),
      category: category,
      type: 'text',
      topic: topic,
      isPrivate: isPrivate,
      companyId: user.companyId,
      // If private, ensure the creator is always included
      memberUids: isPrivate ? {...memberUids, user.uid}.toList() : const [],
    );

    _allChannels.add(newChannel);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyChannels, jsonEncode(_allChannels.map((c) => c.toJson()).toList()));

    _syncForUser(user);
    state = state.copyWith(activeChannel: newChannel);
  }

  Future<void> receiveIncomingMessage(MessageModel message) async {
    final user = ref.read(authProvider).user;
    // Discard message if it doesn't belong to a channel the user can access
    final targetChannel = _allChannels.firstWhere(
      (c) => c.id == message.channelId,
      orElse: () => ChannelModel(id: message.channelId, name: message.channelId, companyId: ''),
    );

    if (!canUserAccessChannel(targetChannel, user)) return;

    _allMessages.add(message);
    state = state.copyWith(messages: [...state.messages, message]);

    final currentUserId = user?.uid ?? '';
    await notificationService.handleIncomingMessage(
      messageId: message.id,
      channelId: message.channelId,
      channelName: targetChannel.name,
      senderId: message.senderId,
      senderName: message.senderName,
      currentUserId: currentUserId,
      messageText: message.text,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyMessages, jsonEncode(_allMessages.map((m) => m.toJson()).toList()));
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
    if (!canUserAccessChannel(state.activeChannel!, user)) return;

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
          ? DateTime.now().millisecondsSinceEpoch + (ephemeralDuration * 1000)
          : 0,
    );

    _allMessages.add(newMessage);
    state = state.copyWith(messages: [...state.messages, newMessage]);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyMessages, jsonEncode(_allMessages.map((m) => m.toJson()).toList()));
  }

  Future<void> toggleReaction(String messageId, String emoji) async {
    await addReaction(messageId, emoji);
  }

  Future<void> addReaction(String messageId, String emoji) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId) return m;

      final reactions = Map<String, List<String>>.from(m.reactions);
      final currentUsers = List<String>.from(reactions[emoji] ?? []);

      if (currentUsers.contains(user.uid)) {
        currentUsers.remove(user.uid);
      } else {
        currentUsers.add(user.uid);
      }

      if (currentUsers.isEmpty) {
        reactions.remove(emoji);
      } else {
        reactions[emoji] = currentUsers;
      }

      return m.copyWith(reactions: reactions);
    }).toList();

    state = state.copyWith(messages: updated);
  }

  Future<void> toggleTaskItem(String messageId, int itemIndex) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId || m.taskList == null) return m;

      final taskMap = Map<String, dynamic>.from(m.taskList!);
      final items = List<Map<String, dynamic>>.from(
        (taskMap['items'] as List).map((i) => Map<String, dynamic>.from(i)),
      );

      if (itemIndex < items.length) {
        final currentDone = items[itemIndex]['done'] == true;
        items[itemIndex]['done'] = !currentDone;
        if (!currentDone) {
          items[itemIndex]['completedBy'] = user.displayName;
        } else {
          items[itemIndex].remove('completedBy');
        }
      }

      taskMap['items'] = items;
      return m.copyWith(taskList: taskMap);
    }).toList();

    state = state.copyWith(messages: updated);
  }

  Future<void> votePoll(String messageId, int optionIndex) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final updated = state.messages.map((m) {
      if (m.id != messageId || m.poll == null) return m;

      final pollMap = Map<String, dynamic>.from(m.poll!);
      final options = List<Map<String, dynamic>>.from(
        (pollMap['options'] as List).map((o) => Map<String, dynamic>.from(o)),
      );

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
