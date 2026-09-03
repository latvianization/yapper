import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';

class TaskChecklistCard extends StatelessWidget {
  final Map<String, dynamic> taskList;
  final Function(int index) onToggleItem;

  const TaskChecklistCard({
    super.key,
    required this.taskList,
    required this.onToggleItem,
  });

  @override
  Widget build(BuildContext context) {
    final title = taskList['title'] as String? ?? 'Tasks';
    final items = List<Map<String, dynamic>>.from(taskList['items'] ?? []);
    final completedCount = items.where((i) => i['done'] == true).length;
    final totalCount = items.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

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
              const Icon(LucideIcons.checkSquare, size: 16, color: AppColors.success),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textMain),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.bgSurfaceHover,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  '$completedCount/$totalCount',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.bgSurface1,
              valueColor: const AlwaysStoppedAnimation(AppColors.success),
              minHeight: 4,
            ),
          ),
          const SizedBox(height: 8),
          ...List.generate(items.length, (idx) {
            final item = items[idx];
            final isDone = item['done'] == true;
            final completedBy = item['completedBy'] as String?;

            return InkWell(
              onTap: () => onToggleItem(idx),
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: isDone ? AppColors.success : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isDone ? AppColors.success : AppColors.textDim,
                          width: 1.5,
                        ),
                      ),
                      child: isDone
                          ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item['text'] as String? ?? '',
                        style: TextStyle(
                          fontSize: 13,
                          decoration: isDone ? TextDecoration.lineThrough : null,
                          color: isDone ? AppColors.textDim : AppColors.textMain,
                        ),
                      ),
                    ),
                    if (completedBy != null)
                      Text(
                        'by $completedBy',
                        style: const TextStyle(fontSize: 10, color: AppColors.textDim),
                      ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
