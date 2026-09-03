import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';

class WhiteboardPoint {
  final Offset offset;
  final Color color;
  final double strokeWidth;

  const WhiteboardPoint({
    required this.offset,
    required this.color,
    required this.strokeWidth,
  });
}

class WhiteboardDialog extends StatefulWidget {
  final Function(String summary) onPost;

  const WhiteboardDialog({super.key, required this.onPost});

  @override
  State<WhiteboardDialog> createState() => _WhiteboardDialogState();
}

class _WhiteboardDialogState extends State<WhiteboardDialog> {
  final List<List<WhiteboardPoint>> _lines = [];
  List<WhiteboardPoint>? _currentLine;
  Color _selectedColor = AppColors.primary;
  double _strokeWidth = 3.0;

  final List<Color> _palette = [
    AppColors.primary,
    AppColors.accent,
    AppColors.success,
    AppColors.warning,
    AppColors.danger,
    Colors.white,
  ];

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.bgSurface1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800, maxHeight: 600),
        child: Column(
          children: [
            // Toolbar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.borderColor)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.edit3, size: 18, color: AppColors.primary),
                  const SizedBox(width: 8),
                  const Text('Collaborative Whiteboard', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Spacer(),
                  ..._palette.map((color) {
                    final isSelected = _selectedColor == color;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedColor = color),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: isSelected ? Border.all(color: Colors.white, width: 2) : null,
                        ),
                      ),
                    );
                  }),
                  const SizedBox(width: 12),
                  IconButton(
                    icon: const Icon(LucideIcons.undo, size: 18),
                    onPressed: _lines.isNotEmpty
                        ? () => setState(() => _lines.removeLast())
                        : null,
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, size: 18),
                    onPressed: () => setState(() => _lines.clear()),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    onPressed: () {
                      widget.onPost('🎨 Shared a whiteboard diagram (${_lines.length} strokes)');
                      Navigator.pop(context);
                    },
                    icon: const Icon(LucideIcons.send, size: 14),
                    label: const Text('Post to Chat'),
                  ),
                ],
              ),
            ),
            // Canvas Drawing Surface
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                child: Container(
                  color: AppColors.bgMain,
                  child: GestureDetector(
                    onPanStart: (details) {
                      setState(() {
                        _currentLine = [
                          WhiteboardPoint(
                            offset: details.localPosition,
                            color: _selectedColor,
                            strokeWidth: _strokeWidth,
                          )
                        ];
                        _lines.add(_currentLine!);
                      });
                    },
                    onPanUpdate: (details) {
                      setState(() {
                        _currentLine?.add(
                          WhiteboardPoint(
                            offset: details.localPosition,
                            color: _selectedColor,
                            strokeWidth: _strokeWidth,
                          ),
                        );
                      });
                    },
                    onPanEnd: (_) {
                      _currentLine = null;
                    },
                    child: CustomPaint(
                      painter: _WhiteboardPainter(lines: _lines),
                      size: Size.infinite,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WhiteboardPainter extends CustomPainter {
  final List<List<WhiteboardPoint>> lines;

  _WhiteboardPainter({required this.lines});

  @override
  void paint(Canvas canvas, Size size) {
    for (final line in lines) {
      if (line.isEmpty) continue;
      final paint = Paint()
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      for (int i = 0; i < line.length - 1; i++) {
        final p1 = line[i];
        final p2 = line[i + 1];
        paint.color = p1.color;
        paint.strokeWidth = p1.strokeWidth;
        canvas.drawLine(p1.offset, p2.offset, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _WhiteboardPainter oldDelegate) => true;
}
