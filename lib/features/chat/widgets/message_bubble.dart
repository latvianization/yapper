import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/core/utils/formatters.dart';
import 'package:yapper/features/auth/providers/auth_provider.dart';
import 'package:yapper/features/chat/models/message_model.dart';
import 'package:yapper/features/chat/providers/chat_provider.dart';
import 'package:yapper/features/chat/widgets/custom_audio_player.dart';
import 'package:yapper/features/chat/widgets/discord_embed_card.dart';
import 'package:yapper/features/chat/widgets/event_card.dart';

import 'package:yapper/features/chat/widgets/kudos_card.dart';
import 'package:yapper/features/chat/widgets/poll_card.dart';
import 'package:yapper/features/chat/widgets/task_checklist_card.dart';
import 'package:yapper/features/chat/widgets/user_avatar.dart';

class MessageBubble extends ConsumerWidget {
  final MessageModel message;

  const MessageBubble({
    super.key,
    required this.message,
  });

  void _showReactionPicker(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgSurface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: AppConstants.emojiList.map((emoji) {
              return InkWell(
                onTap: () {
                  ref.read(chatProvider.notifier).toggleReaction(message.id, emoji);
                  Navigator.pop(ctx);
                },
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(emoji, style: const TextStyle(fontSize: 24)),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUserId = ref.watch(authProvider).user?.uid ?? '';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserAvatar(
            name: message.senderName,
            photoUrl: message.senderPhotoUrl,
            radius: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header (Sender name, timestamp, badges)
                Row(
                  children: [
                    Text(
                      message.senderName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppColors.textMain,
                      ),
                    ),
                    if (message.isBot) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF5865F2), // Discord Blurple
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: const Text(
                          'BOT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(width: 8),
                    Text(
                      Formatters.formatTime(message.createdAt),

                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textDim,
                      ),
                    ),
                    if (message.isE2EE) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0x33F59E0B),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Row(
                          children: [
                            Icon(LucideIcons.lock, size: 10, color: AppColors.warning),
                            SizedBox(width: 3),
                            Text(
                              'E2EE',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppColors.warning,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const Spacer(),
                    IconButton(
                      icon: const Icon(LucideIcons.smile, size: 16, color: AppColors.textDim),
                      onPressed: () => _showReactionPicker(context, ref),
                      splashRadius: 16,
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
                const SizedBox(height: 2),

                // Markdown Message Text
                MarkdownBody(
                  data: message.text,
                  selectable: true,
                  styleSheet: MarkdownStyleSheet(
                    p: const TextStyle(color: AppColors.textMain, fontSize: 14, height: 1.4),
                    code: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 13,
                      backgroundColor: AppColors.bgSurface2,
                      color: AppColors.accentLight,
                    ),
                    codeblockDecoration: BoxDecoration(
                      color: AppColors.bgSurface2,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderColor),
                    ),
                  ),
                ),

                // Attachments (Audio, Images, Files)
                for (final att in message.attachments) ...[
                  if (att['type'] == 'audio')
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: CustomAudioPlayer(
                        url: att['url'] as String? ?? '',
                        title: att['name'] as String? ?? 'Voice Memo',
                      ),
                    ),
                ],

                // Task Checklist Card
                if (message.taskList != null)
                  TaskChecklistCard(
                    taskList: message.taskList!,
                    onToggleItem: (idx) {
                      ref.read(chatProvider.notifier).toggleTaskItem(message.id, idx);
                    },
                  ),

                // Poll Card
                if (message.poll != null)
                  PollCard(
                    poll: message.poll!,
                    currentUserId: currentUserId,
                    onVote: (idx) {
                      ref.read(chatProvider.notifier).votePoll(message.id, idx);
                    },
                  ),

                // Kudos Card
                if (message.kudos != null)
                  KudosCard(kudos: message.kudos!),

                // Event Card
                if (message.eventCard != null)
                  EventCard(
                    event: message.eventCard!,
                    currentUserId: currentUserId,
                  ),

                // Discord Rich Embeds (CI/CD Alerts, Webhook payloads)
                for (final embed in message.embeds) ...[
                  DiscordEmbedCard(embed: embed),
                ],


                // Emoji Reactions
                if (message.reactions.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: message.reactions.entries.map((entry) {
                      final emoji = entry.key;
                      final users = entry.value;
                      final isMine = users.contains(currentUserId);

                      return InkWell(
                        onTap: () {
                          ref.read(chatProvider.notifier).toggleReaction(message.id, emoji);
                        },
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: isMine
                                ? AppColors.primary.withOpacity(0.2)
                                : AppColors.bgSurface2,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isMine ? AppColors.primary : AppColors.borderColor,
                            ),
                          ),
                          child: Text(
                            '$emoji ${users.length}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isMine ? FontWeight.bold : FontWeight.normal,
                              color: isMine ? AppColors.primary : AppColors.textMuted,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
