class MessageModel {
  final String id;
  final String channelId;
  final String senderId;
  final String senderName;
  final String senderPhotoUrl;
  final String text;
  final DateTime createdAt;
  final bool isE2EE;
  final String? encryptedPayload;
  final List<Map<String, dynamic>> attachments;
  final Map<String, List<String>> reactions; // emoji -> list of userIds
  final Map<String, dynamic>? replyTo;
  final Map<String, dynamic>? kudos;
  final Map<String, dynamic>? eventCard;
  final Map<String, dynamic>? taskList;
  final Map<String, dynamic>? poll;
  final int ephemeralExpiresAt; // ms epoch timestamp, 0 = off

  const MessageModel({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.senderName,
    this.senderPhotoUrl = '',
    required this.text,
    required this.createdAt,
    this.isE2EE = false,
    this.encryptedPayload,
    this.attachments = const [],
    this.reactions = const {},
    this.replyTo,
    this.kudos,
    this.eventCard,
    this.taskList,
    this.poll,
    this.ephemeralExpiresAt = 0,
  });

  MessageModel copyWith({
    String? id,
    String? channelId,
    String? senderId,
    String? senderName,
    String? senderPhotoUrl,
    String? text,
    DateTime? createdAt,
    bool? isE2EE,
    String? encryptedPayload,
    List<Map<String, dynamic>>? attachments,
    Map<String, List<String>>? reactions,
    Map<String, dynamic>? replyTo,
    Map<String, dynamic>? kudos,
    Map<String, dynamic>? eventCard,
    Map<String, dynamic>? taskList,
    Map<String, dynamic>? poll,
    int? ephemeralExpiresAt,
  }) {
    return MessageModel(
      id: id ?? this.id,
      channelId: channelId ?? this.channelId,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      senderPhotoUrl: senderPhotoUrl ?? this.senderPhotoUrl,
      text: text ?? this.text,
      createdAt: createdAt ?? this.createdAt,
      isE2EE: isE2EE ?? this.isE2EE,
      encryptedPayload: encryptedPayload ?? this.encryptedPayload,
      attachments: attachments ?? this.attachments,
      reactions: reactions ?? this.reactions,
      replyTo: replyTo ?? this.replyTo,
      kudos: kudos ?? this.kudos,
      eventCard: eventCard ?? this.eventCard,
      taskList: taskList ?? this.taskList,
      poll: poll ?? this.poll,
      ephemeralExpiresAt: ephemeralExpiresAt ?? this.ephemeralExpiresAt,
    );
  }

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as String? ?? '',
      channelId: json['channelId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? 'Teammate',
      senderPhotoUrl: json['senderPhotoUrl'] as String? ?? '',
      text: json['text'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isE2EE: json['isE2EE'] as bool? ?? false,
      encryptedPayload: json['encryptedPayload'] as String?,
      attachments: List<Map<String, dynamic>>.from(json['attachments'] ?? []),
      reactions: Map<String, List<String>>.from(
        (json['reactions'] as Map? ?? {}).map(
          (k, v) => MapEntry(k.toString(), List<String>.from(v ?? [])),
        ),
      ),
      replyTo: json['replyTo'] as Map<String, dynamic>?,
      kudos: json['kudos'] as Map<String, dynamic>?,
      eventCard: json['eventCard'] as Map<String, dynamic>?,
      taskList: json['taskList'] as Map<String, dynamic>?,
      poll: json['poll'] as Map<String, dynamic>?,
      ephemeralExpiresAt: json['ephemeralExpiresAt'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'channelId': channelId,
      'senderId': senderId,
      'senderName': senderName,
      'senderPhotoUrl': senderPhotoUrl,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
      'isE2EE': isE2EE,
      if (encryptedPayload != null) 'encryptedPayload': encryptedPayload,
      'attachments': attachments,
      'reactions': reactions,
      if (replyTo != null) 'replyTo': replyTo,
      if (kudos != null) 'kudos': kudos,
      if (eventCard != null) 'eventCard': eventCard,
      if (taskList != null) 'taskList': taskList,
      if (poll != null) 'poll': poll,
      'ephemeralExpiresAt': ephemeralExpiresAt,
    };
  }
}
