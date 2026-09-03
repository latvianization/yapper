import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';

class PollCard extends StatelessWidget {
  final Map<String, dynamic> poll;
  final String currentUserId;
  final Function(int optionIndex) onVote;

  const PollCard({
    super.key,
    required this.poll,
    required this.currentUserId,
    required this.onVote,
  });

  @override
  Widget build(BuildContext context) {
    final question = poll['question'] as String? ?? 'Team Poll';
    final options = List<Map<String, dynamic>>.from(poll['options'] ?? []);

    int totalVotes = 0;
    for (final opt in options) {
      final votes = List<String>.from(opt['votes'] ?? []);
      totalVotes += votes.length;
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgSurface2,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.barChart2, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  question,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textMain),
                ),
              ),
              Text(
                '$totalVotes votes',
                style: const TextStyle(fontSize: 11, color: AppColors.textDim),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...List.generate(options.length, (idx) {
            final opt = options[idx];
            final text = opt['text'] as String? ?? '';
            final votes = List<String>.from(opt['votes'] ?? []);
            final hasVoted = votes.contains(currentUserId);
            final percent = totalVotes > 0 ? (votes.length / totalVotes) * 100 : 0.0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: InkWell(
                onTap: () => onVote(idx),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.bgSurface1,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: hasVoted ? AppColors.primary : AppColors.borderColor,
                      width: hasVoted ? 1.5 : 1,
                    ),
                  ),
                  child: Stack(
                    children: [
                      FractionallySizedBox(
                        widthFactor: percent > 0 ? percent / 100 : 0.0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: hasVoted
                                ? AppColors.primary.withOpacity(0.25)
                                : AppColors.bgSurfaceHover,
                            borderRadius: BorderRadius.circular(7),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                text,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: hasVoted ? FontWeight.w600 : FontWeight.normal,
                                  color: AppColors.textMain,
                                ),
                              ),
                            ),
                            Text(
                              '${percent.toStringAsFixed(0)}% (${votes.length})',
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
