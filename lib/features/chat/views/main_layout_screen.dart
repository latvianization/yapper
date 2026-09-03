import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/services/notification_service.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/features/auth/providers/auth_provider.dart';
import 'package:yapper/features/chat/models/channel_model.dart';
import 'package:yapper/features/chat/providers/chat_provider.dart';
import 'package:yapper/features/chat/views/channel_webhooks_dialog.dart';
import 'package:yapper/features/chat/views/command_palette_dialog.dart';

import 'package:yapper/features/chat/widgets/chat_input_bar.dart';
import 'package:yapper/features/chat/widgets/message_bubble.dart';
import 'package:yapper/features/chat/widgets/user_avatar.dart';
import 'package:yapper/features/chat/widgets/whiteboard_dialog.dart';
import 'package:yapper/features/events/views/events_hub_dialog.dart';

class MainLayoutScreen extends ConsumerStatefulWidget {
  const MainLayoutScreen({super.key});

  @override
  ConsumerState<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends ConsumerState<MainLayoutScreen> with WidgetsBindingObserver {
  final ScrollController _scrollController = ScrollController();
  StreamSubscription<String>? _notifSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _notifSub = notificationService.onNotificationClick.listen((channelId) {
      final channels = ref.read(chatProvider).channels;
      final target = channels.firstWhere(
        (c) => c.id == channelId,
        orElse: () => channels.first,
      );
      ref.read(chatProvider.notifier).selectChannel(target);
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    notificationService.setLifecycleState(state);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _notifSub?.cancel();
    _scrollController.dispose();
    super.dispose();
  }


  void _openCommandPalette() {
    showDialog(
      context: context,
      builder: (ctx) => CommandPaletteDialog(
        onOpenEvents: _openEventsHub,
        onOpenWhiteboard: _openWhiteboard,
      ),
    );
  }

  void _openEventsHub() {
    showDialog(
      context: context,
      builder: (ctx) => EventsHubDialog(
        onSchedule: (event) {},
      ),
    );
  }

  void _openWhiteboard() {
    showDialog(
      context: context,
      builder: (ctx) => WhiteboardDialog(
        onPost: (summary) {
          ref.read(chatProvider.notifier).sendMessage(text: summary);
        },
      ),
    );
  }

  void _openWebhooksDialog(ChannelModel channel) {
    showDialog(
      context: context,
      builder: (ctx) => ChannelWebhooksDialog(channel: channel),
    );
  }

  void _openCreateChannelDialog() {
    final nameController = TextEditingController();
    final topicController = TextEditingController();
    const category = 'TEXT CHANNELS';
    bool isPrivate = false;
    final authState = ref.read(authProvider);
    final companyUsers = authState.registeredUsers.where((u) => u.companyId == authState.user?.companyId).toList();
    final selectedMembers = <String>{};

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            backgroundColor: AppColors.bgSurface1,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.hash, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        const Text('Create Channel', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textMain)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(LucideIcons.x, size: 18),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text('Channel Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: AppColors.textMain),
                      decoration: const InputDecoration(hintText: 'e.g. leads-chat'),
                    ),
                    const SizedBox(height: 14),
                    const Text('Topic / Purpose', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: topicController,
                      style: const TextStyle(color: AppColors.textMain),
                      decoration: const InputDecoration(hintText: 'What is this channel for?'),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: isPrivate,
                      onChanged: (val) => setDialogState(() => isPrivate = val),
                      title: const Text('Private / Restricted Channel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMain)),
                      subtitle: const Text('Only Workspace Owner and assigned members can view', style: TextStyle(fontSize: 11, color: AppColors.textDim)),
                    ),
                    if (isPrivate) ...[
                      const SizedBox(height: 10),
                      const Text('Assign Members:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDim)),
                      const SizedBox(height: 6),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 130),
                        child: ListView(
                          shrinkWrap: true,
                          children: companyUsers.map((user) {
                            final isOwner = user.role == AppConstants.roleOwner;
                            final isSelected = selectedMembers.contains(user.uid) || isOwner;
                            return CheckboxListTile(
                              dense: true,
                              value: isSelected,
                              enabled: !isOwner,
                              title: Text(
                                '${user.displayName} ${isOwner ? "(Owner - Always Access)" : ""}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMain),
                              ),
                              onChanged: isOwner ? null : (checked) {
                                setDialogState(() {
                                  if (checked == true) {
                                    selectedMembers.add(user.uid);
                                  } else {
                                    selectedMembers.remove(user.uid);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        if (nameController.text.trim().isEmpty) return;
                        ref.read(chatProvider.notifier).createChannel(
                          name: nameController.text.trim(),
                          category: category,
                          topic: topicController.text.trim(),
                          isPrivate: isPrivate,
                          memberUids: selectedMembers.toList(),
                        );
                        Navigator.pop(ctx);
                      },
                      child: const Text('Create Channel', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final messages = ref.watch(currentChannelMessagesProvider);
    final isDesktop = MediaQuery.of(context).size.width >= 800;

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): _openCommandPalette,
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): _openCommandPalette,
      },
      child: Scaffold(
        drawer: isDesktop ? null : Drawer(child: _buildSidebar(context)),
        body: Row(
          children: [
            // Persistent Sidebar for Desktop/Tablet
            if (isDesktop)
              SizedBox(
                width: 260,
                child: _buildSidebar(context),
              ),

            // Main Chat Column
            Expanded(
              child: Column(
                children: [
                  // Channel Header Bar
                  _buildHeader(context, isDesktop),

                  // Messages Scrollable Feed
                  Expanded(
                    child: messages.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(LucideIcons.messageSquare, size: 48, color: AppColors.textDim),
                                const SizedBox(height: 12),
                                Text(
                                  'No messages in #${chatState.activeChannel?.name ?? "general"} yet.',
                                  style: const TextStyle(color: AppColors.textMuted),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Be the first to say hi or post an update!',
                                  style: TextStyle(color: AppColors.textDim, fontSize: 12),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            itemCount: messages.length,
                            itemBuilder: (context, index) {
                              final msg = messages[index];
                              return MessageBubble(message: msg);
                            },
                          ),
                  ),

                  // Input Bar
                  ChatInputBar(
                    onOpenWhiteboard: _openWhiteboard,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDesktop) {
    final chatState = ref.watch(chatProvider);
    final active = chatState.activeChannel;

    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: AppColors.bgSidebar,
        border: Border(bottom: BorderSide(color: AppColors.borderColor)),
      ),
      child: Row(
        children: [
          if (!isDesktop)
            IconButton(
              icon: const Icon(LucideIcons.menu),
              onPressed: () => Scaffold.of(context).openDrawer(),
            ),
          Icon(
            active?.isPrivate == true ? LucideIcons.lock : LucideIcons.hash,
            size: 18,
            color: AppColors.primary,
          ),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  active?.name ?? 'general',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textMain),
                  overflow: TextOverflow.ellipsis,
                ),
                if (active?.description.isNotEmpty == true)
                  Text(
                    active!.description,
                    style: const TextStyle(fontSize: 11, color: AppColors.textDim),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Command Palette Search Trigger
          InkWell(
            onTap: _openCommandPalette,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.bgSurface1,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderColor),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.search, size: 14, color: AppColors.textDim),
                  SizedBox(width: 6),
                  Text('Search or ⌘K', style: TextStyle(fontSize: 12, color: AppColors.textDim)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(LucideIcons.calendar, size: 18, color: AppColors.textMuted),
            onPressed: _openEventsHub,
            tooltip: 'Events Hub',
          ),
          if (active != null) ...[
            IconButton(
              icon: const Icon(LucideIcons.webhook, size: 18, color: AppColors.textMuted),
              onPressed: () => _openWebhooksDialog(active),
              tooltip: 'Discord CI Webhooks & Integrations',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSidebar(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final authState = ref.watch(authProvider);

    final categories = ['ANNOUNCEMENTS', 'TEXT CHANNELS', 'CI & ALERTS', 'VOICE & HUDDLES'];

    return Material(
      color: AppColors.bgSidebar,
      child: Column(
        children: [
          // Workspace Header
          Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.borderColor)),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('⚡', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(authState.user?.companyName ?? 'Yapper HQ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textMain), overflow: TextOverflow.ellipsis),
                      Text(authState.user?.role == 'owner' ? '👑 Workspace Owner' : '👥 Team Member', style: const TextStyle(fontSize: 10, color: AppColors.textDim), overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Channel List Grouped by Discord Categories
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                // Quick Hub Actions
                ListTile(
                  dense: true,
                  leading: const Icon(LucideIcons.calendar, size: 16, color: AppColors.primary),
                  title: const Text('Events Hub', style: TextStyle(fontSize: 13, color: AppColors.textMain)),
                  onTap: _openEventsHub,
                ),
                ListTile(
                  dense: true,
                  leading: const Icon(LucideIcons.penTool, size: 16, color: AppColors.accent),
                  title: const Text('Whiteboard', style: TextStyle(fontSize: 13, color: AppColors.textMain)),
                  onTap: _openWhiteboard,
                ),
                const SizedBox(height: 6),

                // Discord-Style Categories
                for (final category in categories) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.chevronDown, size: 11, color: AppColors.textDim),
                        const SizedBox(width: 4),
                        Text(
                          category,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDim,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const Spacer(),
                        if (category == 'TEXT CHANNELS')
                          InkWell(
                            onTap: _openCreateChannelDialog,
                            child: const Icon(LucideIcons.plus, size: 14, color: AppColors.textDim),
                          ),
                      ],
                    ),
                  ),
                  ...chatState.channels.where((c) => c.category == category).map((ch) {
                    final isSelected = ch.id == chatState.activeChannel?.id;
                    IconData channelIcon;
                    if (ch.isPrivate) {
                      channelIcon = LucideIcons.lock;
                    } else if (ch.type == 'voice') {
                      channelIcon = LucideIcons.volume2;
                    } else if (ch.category == 'CI & ALERTS') {
                      channelIcon = LucideIcons.bot;
                    } else if (ch.category == 'ANNOUNCEMENTS') {
                      channelIcon = LucideIcons.megaphone;
                    } else {
                      channelIcon = LucideIcons.hash;
                    }

                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
                      child: Material(
                        color: isSelected ? AppColors.bgSurfaceHover : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        child: ListTile(
                          dense: true,
                          leading: Icon(
                            channelIcon,
                            size: 15,
                            color: isSelected ? AppColors.primary : AppColors.textDim,
                          ),
                          title: Text(
                            ch.name,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: isSelected ? AppColors.textMain : AppColors.textMuted,
                            ),
                          ),
                          onTap: () {
                            ref.read(chatProvider.notifier).selectChannel(ch);
                            if (Scaffold.of(context).isDrawerOpen) {
                              Navigator.pop(context);
                            }
                          },
                        ),
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),


          // Current User Profile Footer
          if (authState.user != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.borderColor)),
              ),
              child: Row(
                children: [
                  UserAvatar(
                    name: authState.user!.displayName,
                    photoUrl: authState.user!.photoUrl,
                    status: authState.user!.status,
                    radius: 16,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authState.user!.displayName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textMain),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          authState.user!.role == 'owner' ? '👑 Owner' : '👥 Member',
                          style: const TextStyle(fontSize: 11, color: AppColors.textDim),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.logOut, size: 16, color: AppColors.textDim),
                    tooltip: 'Sign Out',
                    onPressed: () {
                      ref.read(authProvider.notifier).logout();
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
