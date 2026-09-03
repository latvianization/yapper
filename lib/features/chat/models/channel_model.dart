class ChannelModel {
  final String id;
  final String name;
  final String description;
  final String category; // ANNOUNCEMENTS, TEXT CHANNELS, CI & ALERTS, VOICE & HUDDLES
  final String type; // text, voice, announcement
  final String topic;
  final bool isPrivate;
  final int unreadCount;

  const ChannelModel({
    required this.id,
    required this.name,
    this.description = '',
    this.category = 'TEXT CHANNELS',
    this.type = 'text',
    this.topic = '',
    this.isPrivate = false,
    this.unreadCount = 0,
  });

  ChannelModel copyWith({
    String? id,
    String? name,
    String? description,
    String? category,
    String? type,
    String? topic,
    bool? isPrivate,
    int? unreadCount,
  }) {
    return ChannelModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      type: type ?? this.type,
      topic: topic ?? this.topic,
      isPrivate: isPrivate ?? this.isPrivate,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }

  factory ChannelModel.fromJson(Map<String, dynamic> map) {
    return ChannelModel(
      id: map['id'] as String? ?? '',
      name: map['name'] as String? ?? 'general',
      description: map['description'] as String? ?? '',
      category: map['category'] as String? ?? 'TEXT CHANNELS',
      type: map['type'] as String? ?? 'text',
      topic: map['topic'] as String? ?? map['description'] as String? ?? '',
      isPrivate: map['isPrivate'] as bool? ?? false,
      unreadCount: map['unreadCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'type': type,
      'topic': topic,
      'isPrivate': isPrivate,
      'unreadCount': unreadCount,
    };
  }
}
