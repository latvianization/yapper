class EventModel {
  final String id;
  final String title;
  final String description;
  final String categoryId;
  final DateTime startDate;
  final int durationMinutes;
  final String location;
  final bool isLive;
  final List<String> going;
  final List<String> interested;

  const EventModel({
    required this.id,
    required this.title,
    this.description = '',
    required this.categoryId,
    required this.startDate,
    this.durationMinutes = 60,
    this.location = 'Voice Huddle Stage',
    this.isLive = false,
    this.going = const [],
    this.interested = const [],
  });

  EventModel copyWith({
    String? id,
    String? title,
    String? description,
    String? categoryId,
    DateTime? startDate,
    int? durationMinutes,
    String? location,
    bool? isLive,
    List<String>? going,
    List<String>? interested,
  }) {
    return EventModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      categoryId: categoryId ?? this.categoryId,
      startDate: startDate ?? this.startDate,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      location: location ?? this.location,
      isLive: isLive ?? this.isLive,
      going: going ?? this.going,
      interested: interested ?? this.interested,
    );
  }

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      categoryId: json['categoryId'] as String? ?? 'townhall',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      durationMinutes: json['durationMinutes'] as int? ?? 60,
      location: json['location'] as String? ?? 'Voice Huddle Stage',
      isLive: json['isLive'] as bool? ?? false,
      going: List<String>.from(json['going'] ?? []),
      interested: List<String>.from(json['interested'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'categoryId': categoryId,
      'startDate': startDate.toIso8601String(),
      'durationMinutes': durationMinutes,
      'location': location,
      'isLive': isLive,
      'going': going,
      'interested': interested,
    };
  }
}
