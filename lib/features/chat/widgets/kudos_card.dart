import 'package:flutter/material.dart';
import 'package:yapper/core/theme/app_theme.dart';

class KudosCard extends StatelessWidget {
  final Map<String, dynamic> kudos;

  const KudosCard({
    super.key,
    required this.kudos,
  });

  @override
  Widget build(BuildContext context) {
    final badge = Map<String, dynamic>.from(kudos['badge'] ?? {});
    final reason = kudos['reason'] as String? ?? '';
    final recipient = kudos['recipientName'] as String? ?? 'teammate';
    final sender = kudos['senderName'] as String? ?? 'someone';

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgSurface2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.accent.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badge['icon'] as String? ?? '🌟',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'PEER RECOGNITION',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: AppColors.accentLight,
                    ),
                  ),
                  Text(
                    badge['name'] as String? ?? 'Kudos',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (reason.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              '"$reason"',
              style: const TextStyle(
                fontStyle: FontStyle.italic,
                fontSize: 13,
                color: AppColors.textMain,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Awarded to @$recipient by $sender',
            style: const TextStyle(fontSize: 11, color: AppColors.textDim),
          ),
        ],
      ),
    );
  }
}
