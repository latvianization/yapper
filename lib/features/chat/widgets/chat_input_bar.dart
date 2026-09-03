import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/features/chat/providers/chat_provider.dart';

class ChatInputBar extends ConsumerStatefulWidget {
  final VoidCallback onOpenWhiteboard;

  const ChatInputBar({
    super.key,
    required this.onOpenWhiteboard,
  });

  @override
  ConsumerState<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends ConsumerState<ChatInputBar> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final hasText = _controller.text.trim().isNotEmpty;
      if (hasText != _hasText) {
        setState(() => _hasText = hasText);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    // Handle slash commands
    if (text.startsWith('/todo ')) {
      final taskText = text.substring(6).trim();
      final items = taskText.split(',').map((s) => {'text': s.trim(), 'done': false}).toList();
      ref.read(chatProvider.notifier).sendMessage(
        text: 'Shared a task list:',
        taskList: {
          'title': 'Task Checklist',
          'items': items,
        },
      );
    } else if (text.startsWith('/poll ')) {
      final pollQuestion = text.substring(6).trim();
      ref.read(chatProvider.notifier).sendMessage(
        text: 'Started a poll:',
        poll: {
          'question': pollQuestion,
          'options': [
            {'text': 'Yes / Approve', 'votes': []},
            {'text': 'No / Needs Revision', 'votes': []},
            {'text': 'Neutral / Abstain', 'votes': []},
          ]
        },
      );
    } else if (text.startsWith('/shrug')) {
      final rest = text.substring(6).trim();
      ref.read(chatProvider.notifier).sendMessage(text: '$rest ¯\\_(ツ)_/¯');
    } else {
      ref.read(chatProvider.notifier).sendMessage(text: text);
    }

    _controller.clear();
    _focusNode.requestFocus();
  }

  void _showE2EEDialog() {
    final passCtrl = TextEditingController();
    final isE2EEActive = ref.read(chatProvider).isE2EEActive;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgSurface1,
        title: Row(
          children: [
            Icon(LucideIcons.lock, color: isE2EEActive ? AppColors.warning : AppColors.textDim),
            const SizedBox(width: 8),
            Text(isE2EEActive ? 'Disable E2EE Mode' : 'Enable Zero-Knowledge E2EE'),
          ],
        ),
        content: isE2EEActive
            ? const Text('Are you sure you want to return to standard chat mode?')
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Messages will be encrypted locally with AES-GCM 256 before transmission. Enter a shared secret passphrase:',
                    style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: passCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      hintText: 'Secret passphrase',
                      prefixIcon: Icon(LucideIcons.key),
                    ),
                  ),
                ],
              ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isE2EEActive ? AppColors.danger : AppColors.primary,
            ),
            onPressed: () {
              ref.read(chatProvider.notifier).toggleE2EE(passCtrl.text.trim());
              Navigator.pop(ctx);
            },
            child: Text(isE2EEActive ? 'Disable' : 'Activate E2EE'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final isE2EEActive = chatState.isE2EEActive;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.bgMain,
        border: Border(top: BorderSide(color: AppColors.borderColor)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isE2EEActive)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0x26F59E0B),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.warning.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.shieldCheck, size: 14, color: AppColors.warning),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'E2EE Active • Fingerprint: ${chatState.e2eeFingerprint}',
                        style: const TextStyle(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                // Attachments / Tools Popover
                IconButton(
                  icon: const Icon(LucideIcons.plusCircle, color: AppColors.textMuted),
                  onPressed: widget.onOpenWhiteboard,
                  tooltip: 'Whiteboard & Tools',
                ),
                // E2EE Lock Toggle
                IconButton(
                  icon: Icon(
                    isE2EEActive ? LucideIcons.lock : LucideIcons.unlock,
                    color: isE2EEActive ? AppColors.warning : AppColors.textDim,
                  ),
                  onPressed: _showE2EEDialog,
                  tooltip: 'Toggle Zero-Knowledge E2EE',
                ),
                // Text Field
                Expanded(
                  child: TextField(
                    controller: _controller,
                    focusNode: _focusNode,
                    minLines: 1,
                    maxLines: 4,
                    onSubmitted: (_) => _sendMessage(),
                    decoration: InputDecoration(
                      hintText: 'Message #${chatState.activeChannel?.name ?? "general"} (use /todo, /poll, /shrug)...',
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Send or Voice Memo Button
                IconButton.filled(
                  style: IconButton.filled(
                    backgroundColor: _hasText ? AppColors.primary : AppColors.bgSurface2,
                  ),
                  icon: Icon(
                    _hasText ? LucideIcons.send : LucideIcons.mic,
                    size: 18,
                    color: _hasText ? Colors.white : AppColors.textMuted,
                  ),
                  onPressed: _hasText ? _sendMessage : null,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
