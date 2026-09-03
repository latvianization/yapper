import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/features/chat/models/channel_model.dart';

class ChannelWebhooksDialog extends StatefulWidget {
  final ChannelModel channel;

  const ChannelWebhooksDialog({super.key, required this.channel});

  @override
  State<ChannelWebhooksDialog> createState() => _ChannelWebhooksDialogState();
}

class _ChannelWebhooksDialogState extends State<ChannelWebhooksDialog> {
  late String _webhookUrl;
  bool _copied = false;

  @override
  void initState() {
    super.initState();
    _webhookUrl = 'http://localhost:3000/api/webhooks/${widget.channel.id}/wh_sec_${widget.channel.id}_ci_9981';
  }

  void _copyToClipboard() {
    Clipboard.setData(ClipboardData(text: _webhookUrl));
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.bgSurface1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF5865F2).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(LucideIcons.webhook, color: Color(0xFF5865F2), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '#${widget.channel.name} • CI Webhooks',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textMain),
                      ),
                      const Text(
                        'Discord-compatible webhook endpoint for CI/CD pipelines',
                        style: TextStyle(fontSize: 12, color: AppColors.textDim),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),

              const Text(
                'DISCORD-COMPATIBLE WEBHOOK URL',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDim, letterSpacing: 0.5),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.bgSurface2,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.borderColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _webhookUrl,
                        style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: AppColors.textMain),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _copied ? AppColors.success : AppColors.primary,
                        visualDensity: VisualDensity.compact,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: _copyToClipboard,
                      icon: Icon(_copied ? LucideIcons.check : LucideIcons.copy, size: 14),
                      label: Text(_copied ? 'Copied!' : 'Copy URL', style: const TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
              const Text(
                'CURL / CI/CD PAYLOAD EXAMPLE',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textDim, letterSpacing: 0.5),
              ),
              const SizedBox(height: 8),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgMain,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.borderColor),
                ),
                child: const SelectableText(
                  'curl -X POST "\$YAPPER_WEBHOOK_URL" \\\n'
                  '  -H "Content-Type: application/json" \\\n'
                  '  -d \'{\n'
                  '    "username": "GitHub Actions",\n'
                  '    "content": "🚀 Build #142 passed on branch `main`",\n'
                  '    "embeds": [{\n'
                  '      "title": "CI Pipeline Succeeded",\n'
                  '      "color": 65280,\n'
                  '      "fields": [\n'
                  '        { "name": "Branch", "value": "main", "inline": true },\n'
                  '        { "name": "Commit", "value": "a8f23bc", "inline": true }\n'
                  '      ]\n'
                  '    }]\n'
                  '  }\'',
                  style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.textMuted, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
