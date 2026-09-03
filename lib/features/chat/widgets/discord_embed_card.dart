import 'package:flutter/material.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/core/utils/formatters.dart';

class DiscordEmbedCard extends StatelessWidget {
  final Map<String, dynamic> embed;

  const DiscordEmbedCard({super.key, required this.embed});

  Color _parseColor(dynamic colorValue) {
    if (colorValue == null) return AppColors.primary;
    if (colorValue is int) {
      // Hex or integer like 65280 (0x00FF00) or 0x3B82F6
      return Color(0xFF000000 | colorValue);
    }
    if (colorValue is String) {
      final clean = colorValue.replaceAll('#', '');
      final val = int.tryParse(clean, radix: 16);
      if (val != null) {
        return Color(clean.length <= 6 ? 0xFF000000 | val : val);
      }
    }
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final title = embed['title'] as String? ?? '';
    final description = embed['description'] as String? ?? '';
    final author = embed['author'] as Map<String, dynamic>?;
    final footer = embed['footer'] as Map<String, dynamic>?;
    final fields = List<Map<String, dynamic>>.from(embed['fields'] ?? []);
    final timestampStr = embed['timestamp'] as String?;
    final timestamp = timestampStr != null ? DateTime.tryParse(timestampStr) : null;
    final stripColor = _parseColor(embed['color']);

    return Container(
      margin: const EdgeInsets.only(top: 8),
      constraints: const BoxConstraints(maxWidth: 580),
      decoration: BoxDecoration(
        color: AppColors.bgSurface2,
        borderRadius: BorderRadius.circular(6),
        border: Border(
          left: BorderSide(color: stripColor, width: 4),
          top: const BorderSide(color: AppColors.borderColor),
          right: const BorderSide(color: AppColors.borderColor),
          bottom: const BorderSide(color: AppColors.borderColor),
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author
          if (author != null) ...[
            Row(
              children: [
                if (author['iconUrl'] != null && (author['iconUrl'] as String).isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: Image.network(
                      author['iconUrl'] as String,
                      width: 18,
                      height: 18,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  author['name'] as String? ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.textMain),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],

          // Title
          if (title.isNotEmpty) ...[
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
            ),
            const SizedBox(height: 4),
          ],

          // Description
          if (description.isNotEmpty) ...[
            Text(
              description,
              style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.35),
            ),
            const SizedBox(height: 8),
          ],

          // Fields Grid (Inline & Block fields)
          if (fields.isNotEmpty) ...[
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: fields.map((f) {
                final isInline = f['inline'] == true;
                return SizedBox(
                  width: isInline ? 150 : double.infinity,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        f['name'] as String? ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textDim,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        f['value'] as String? ?? '',
                        style: const TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: AppColors.textMain,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
          ],

          // Footer & Timestamp
          if (footer != null || timestamp != null) ...[
            Row(
              children: [
                if (footer != null && footer['iconUrl'] != null && (footer['iconUrl'] as String).isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: Image.network(
                      footer['iconUrl'] as String,
                      width: 14,
                      height: 14,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                if (footer != null && footer['text'] != null)
                  Text(
                    footer['text'] as String,
                    style: const TextStyle(fontSize: 10, color: AppColors.textDim),
                  ),
                if (footer != null && timestamp != null)
                  const Text(' • ', style: TextStyle(fontSize: 10, color: AppColors.textDim)),
                if (timestamp != null)
                  Text(
                    Formatters.formatTime(timestamp),
                    style: const TextStyle(fontSize: 10, color: AppColors.textDim),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
