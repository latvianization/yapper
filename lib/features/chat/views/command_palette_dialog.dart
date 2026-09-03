import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/features/chat/providers/chat_provider.dart';

class CommandPaletteDialog extends ConsumerStatefulWidget {
  final VoidCallback onOpenEvents;
  final VoidCallback onOpenWhiteboard;

  const CommandPaletteDialog({
    super.key,
    required this.onOpenEvents,
    required this.onOpenWhiteboard,
  });

  @override
  ConsumerState<CommandPaletteDialog> createState() => _CommandPaletteDialogState();
}

class _CommandPaletteDialogState extends ConsumerState<CommandPaletteDialog> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final channels = chatState.channels.where(
      (c) => c.name.toLowerCase().contains(_query.toLowerCase()),
    ).toList();

    final slashCmds = AppConstants.slashCommands.where(
      (c) => c['cmd']!.toLowerCase().contains(_query.toLowerCase()) ||
          c['desc']!.toLowerCase().contains(_query.toLowerCase()),
    ).toList();

    return Dialog(
      backgroundColor: AppColors.bgSurface1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      alignment: Alignment.topCenter,
      insetPadding: const EdgeInsets.only(top: 80, left: 24, right: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 480),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                controller: _searchController,
                autofocus: true,
                onChanged: (val) => setState(() => _query = val),
                decoration: const InputDecoration(
                  hintText: 'Type a command, jump to channel, or search...',
                  prefixIcon: Icon(LucideIcons.search, size: 18),
                ),
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  // Quick Actions
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Text('QUICK ACTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDim)),
                  ),
                  ListTile(
                    leading: const Icon(LucideIcons.calendar, color: AppColors.primary, size: 18),
                    title: const Text('Company Events Hub', style: TextStyle(fontSize: 14)),
                    trailing: const Text('Enter', style: TextStyle(fontSize: 11, color: AppColors.textDim)),
                    onTap: () {
                      Navigator.pop(context);
                      widget.onOpenEvents();
                    },
                  ),
                  ListTile(
                    leading: const Icon(LucideIcons.edit3, color: AppColors.accent, size: 18),
                    title: const Text('Open Collaborative Whiteboard', style: TextStyle(fontSize: 14)),
                    onTap: () {
                      Navigator.pop(context);
                      widget.onOpenWhiteboard();
                    },
                  ),
                  const Divider(),
                  // Channels
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Text('CHANNELS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDim)),
                  ),
                  ...channels.map((ch) {
                    return ListTile(
                      leading: const Icon(LucideIcons.hash, size: 18, color: AppColors.textDim),
                      title: Text(ch.name, style: const TextStyle(fontSize: 14)),
                      subtitle: Text(ch.description, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      onTap: () {
                        ref.read(chatProvider.notifier).selectChannel(ch);
                        Navigator.pop(context);
                      },
                    );
                  }),
                  const Divider(),
                  // Slash Commands
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    child: Text('SLASH COMMANDS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDim)),
                  ),
                  ...slashCmds.map((cmd) {
                    return ListTile(
                      leading: const Icon(LucideIcons.terminal, size: 18, color: AppColors.success),
                      title: Text(cmd['cmd']!, style: const TextStyle(fontSize: 13, fontFamily: 'monospace')),
                      subtitle: Text(cmd['desc']!, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      onTap: () {
                        Navigator.pop(context);
                      },
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
