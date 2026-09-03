import 'package:flutter/material.dart';
import 'package:yapper/core/utils/formatters.dart';

class UserAvatar extends StatelessWidget {
  final String name;
  final String photoUrl;
  final String status;
  final double radius;
  final bool showStatus;

  const UserAvatar({
    super.key,
    required this.name,
    this.photoUrl = '',
    this.status = '',
    this.radius = 18,
    this.showStatus = true,
  });

  Color _getStatusColor() {
    switch (status) {
      case 'online':
        return const Color(0xFF10B981);
      case 'busy':
        return const Color(0xFFEF4444);
      case 'away':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        CircleAvatar(
          radius: radius,
          backgroundColor: Formatters.getAvatarColor(name),
          backgroundImage: photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
          child: photoUrl.isEmpty
              ? Text(
                  Formatters.getInitials(name),
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: radius * 0.85,
                  ),
                )
              : null,
        ),
        if (showStatus && status.isNotEmpty)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: radius * 0.55,
              height: radius * 0.55,
              decoration: BoxDecoration(
                color: _getStatusColor(),
                shape: BoxShape.circle,
                border: Border.pad(BorderSide(color: Theme.of(context).scaffoldBackgroundColor, width: 2)).top != null
                    ? Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2)
                    : null,
              ),
            ),
          ),
      ],
    );
  }
}
