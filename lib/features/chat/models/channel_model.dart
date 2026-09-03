class ChannelModel {
  final String id;
  final String name;
  final String description;
  final String type; // channel, direct, event, bookmarks
  final bool isPrivate;
  final int unreadCount;

  const ChannelModel({
    required this.id,
    required this.name,
    this.description = '',
    this.type = 'channel',
    this.isPrivate = false,
    this.unreadCount = 0,
  });

  ChannelModel copyWith({
    String? id,
    String? name,
    String? description,
    String? type,
    bool? isPrivate,
    int? unreadCount,
  }) {
    return ChannelModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      isPrivate: isPrivate ?? this.isPrivate,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }

  factory ChannelModel.fromJson(Map<String, dynamic> map) {
    return ChannelModel(
      id: map['id'] as String? ?? '',
      name: map['name'] as String? ?? 'general',
      description: map['description'] as String? ?? '',
      type: map['type'] as String? ?? 'channel',
      isPrivate: map['isPrivate'] as bool? ?? false,
      unreadCount: map['unreadCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'type': type,
      'isPrivate': isPrivate,
      'unreadCount': unreadCount,
    };
  }
}
