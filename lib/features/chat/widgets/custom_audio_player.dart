import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:yapper/core/theme/app_theme.dart';
import 'package:yapper/core/utils/formatters.dart';

class CustomAudioPlayer extends StatefulWidget {
  final String url;
  final String title;

  const CustomAudioPlayer({
    super.key,
    required this.url,
    this.title = 'Voice Memo',
  });

  @override
  State<CustomAudioPlayer> createState() => _CustomAudioPlayerState();
}

class _CustomAudioPlayerState extends State<CustomAudioPlayer> {
  bool _isPlaying = false;
  int _currentTime = 0;
  final int _duration = 28; // demo duration in seconds
  final List<double> _speeds = [1.0, 1.25, 1.5, 2.0];
  int _speedIndex = 0;

  final List<double> _peaks = [
    18, 35, 60, 45, 80, 95, 70, 50, 85, 100, 65, 40, 55, 90, 75, 45, 60, 80, 50, 30, 40, 70, 90, 60, 45, 20
  ];

  void _togglePlay() {
    setState(() {
      _isPlaying = !_isPlaying;
      if (_isPlaying && _currentTime >= _duration) {
        _currentTime = 0;
      }
    });
  }

  void _cycleSpeed() {
    setState(() {
      _speedIndex = (_speedIndex + 1) % _speeds.length;
    });
  }

  void _seek(int index) {
    setState(() {
      final ratio = index / _peaks.length;
      _currentTime = (ratio * _duration).round();
    });
  }

  @override
  Widget build(BuildContext context) {
    final progressRatio = _duration > 0 ? _currentTime / _duration : 0.0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.bgSurface2,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderColor),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: _togglePlay,
            icon: Icon(
              _isPlaying ? LucideIcons.pause : LucideIcons.play,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 36,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(_peaks.length, (idx) {
                      final peak = _peaks[idx];
                      final isActive = (idx / _peaks.length) <= progressRatio;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => _seek(idx),
                          behavior: HitTestBehavior.opaque,
                          child: Container(
                            margin: const EdgeInsets.symmetric(horizontal: 1),
                            height: (peak / 100.0) * 32,
                            decoration: BoxDecoration(
                              color: isActive ? AppColors.primary : AppColors.textDim.withOpacity(0.35),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      Formatters.formatDuration(_currentTime),
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                    ),
                    Text(
                      Formatters.formatDuration(_duration),
                      style: const TextStyle(fontSize: 11, color: AppColors.textDim),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _cycleSpeed,
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.bgSurfaceHover,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${_speeds[_speedIndex]}x',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
