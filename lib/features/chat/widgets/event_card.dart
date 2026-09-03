import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';

class EventCard extends StatelessWidget {
  final Map<String, dynamic> event;
  final String currentUserId;
  final VoidCallback? onOpenChat;

  const EventCard({
    super.key,
    required this.event,
    required this.currentUserId,
    this.onOpenChat,
  });

  @override
  Widget build(BuildContext context) {
    final title = event['title'] as String? ?? 'Company Event';
    final desc = event['description'] as String? ?? '';
    final category = Map<String, dynamic>.from(event['category'] ?? {});
    final isLive = event['isLive'] == true;
    final rsvps = Map<String, dynamic>.from(event['rsvps'] ?? {});
    final going = List<String>.from(rsvps['going'] ?? []);

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgSurface2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isLive ? AppColors.danger : AppColors.borderColor,
          width: isLive ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                category['icon'] as String? ?? '📅',
                style: const TextStyle(fontSize: 20),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          category['name'] as String? ?? 'Event',
                          style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                        if (isLive) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: AppColors.danger,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              '🔴 LIVE',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ]
                      ],
                    ),
                    Text(
                      title,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textMain),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (desc.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.bgSurface1,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.checkCircle, size: 14, color: AppColors.success),
                    const SizedBox(width: 4),
                    Text('Going (${going.length})', style: const TextStyle(fontSize: 12, color: AppColors.textMain)),
                  ],
                ),
              ),
              const Spacer(),
              if (onOpenChat != null)
                TextButton.icon(
                  onPressed: onOpenChat,
                  icon: const Icon(LucideIcons.messageSquare, size: 14),
                  label: const Text('Event Chat', style: TextStyle(fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
