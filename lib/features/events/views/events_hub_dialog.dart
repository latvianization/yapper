import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:yapper/core/constants/app_constants.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/core/utils/formatters.dart';
import 'package:yapper/features/events/models/event_model.dart';

class EventsHubDialog extends StatefulWidget {
  final Function(EventModel event) onSchedule;

  const EventsHubDialog({super.key, required this.onSchedule});

  @override
  State<EventsHubDialog> createState() => _EventsHubDialogState();
}

class _EventsHubDialogState extends State<EventsHubDialog> {
  String _selectedCategory = 'all';

  final List<EventModel> _events = [
    EventModel(
      id: 'evt_townhall',
      title: 'Q3 All Hands & Company Roadmap',
      description: 'Reviewing key engineering milestones, Flutter migration launch, and product roadmap.',
      categoryId: 'townhall',
      startDate: DateTime.now().add(const Duration(hours: 4)),
      durationMinutes: 45,
      isLive: true,
      going: ['user_alex', 'user_sarah', 'user_marcus'],
    ),
    EventModel(
      id: 'evt_techtalk',
      title: 'Deep Dive: Multiplatform Flutter Architecture',
      description: 'Practical walkthrough of Riverpod notifiers, GoRouter shell navigation, and Isolate-powered E2EE cryptography.',
      categoryId: 'techtalk',
      startDate: DateTime.now().add(const Duration(days: 2)),
      durationMinutes: 60,
      going: ['user_alex'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedCategory == 'all'
        ? _events
        : _events.where((e) => e.categoryId == _selectedCategory).toList();

    return Dialog(
      backgroundColor: AppColors.bgSurface1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 700, maxHeight: 650),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(LucideIcons.calendar, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Text('Company Events Hub', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Category Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildCategoryPill('all', '🌟 All Events'),
                  ...AppConstants.eventCategories.map((cat) {
                    return _buildCategoryPill(cat['id'], '${cat['icon']} ${cat['name']}');
                  }),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Divider(),
            // Event List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (ctx, idx) {
                  final event = filtered[idx];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.bgSurface2,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: event.isLive ? AppColors.danger : AppColors.borderColor,
                        width: event.isLive ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (event.isLive) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.danger,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text('🔴 LIVE STAGE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                              ),
                              const SizedBox(width: 8),
                            ],
                            Expanded(
                              child: Text(
                                event.title,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textMain),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(event.description, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Icon(LucideIcons.clock, size: 14, color: AppColors.textDim),
                            const SizedBox(width: 4),
                            Text(Formatters.formatTime(event.startDate), style: const TextStyle(fontSize: 12, color: AppColors.textDim)),
                            const Spacer(),
                            Text('${event.going.length} Going', style: const TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryPill(String id, String label) {
    final isSelected = _selectedCategory == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppColors.textMuted)),
        selected: isSelected,
        selectedColor: AppColors.primary,
        backgroundColor: AppColors.bgSurface2,
        onSelected: (_) => setState(() => _selectedCategory = id),
      ),
    );
  }
}
